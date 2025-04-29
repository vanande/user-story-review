import { NextResponse } from "next/server";
import { openDb, getActiveDatasetId } from "@/lib/db";

export async function GET(request: Request) {
    let db;
    try {
        db = await openDb();
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ error: "Email query parameter is required" }, { status: 400 });
        }

        // Find tester ID
        const tester = await db.get("SELECT id FROM testers WHERE LOWER(email) = LOWER(?)", [email]); // Case-insensitive email check
        if (!tester) {
            // Return 0 stats if tester not found
            console.warn(`Dashboard Stats: Tester not found for email: ${email}`);
            // Still need total for "left" calculation, fetch it anyway if possible
            const activeDatasetIdFallback = await getActiveDatasetId(db);
            let totalCountFallback = 0;
            if (activeDatasetIdFallback) {
                const totalResultFallback = await db.get("SELECT COUNT(*) as count FROM user_stories WHERE dataset_id = ?", [activeDatasetIdFallback]);
                totalCountFallback = totalResultFallback?.count || 0;
            }
            return NextResponse.json({ success: true, data: { completed: 0, total: totalCountFallback, left: totalCountFallback } });
        }
        const testerId = tester.id;

        // Get active dataset ID
        const activeDatasetId = await getActiveDatasetId(db);
        if (!activeDatasetId) {
            console.error("Dashboard Stats: No active dataset found.");
            return NextResponse.json({ error: "No active dataset configured" }, { status: 500 });
        }

        // Count distinct stories reviewed by this user in the active dataset
        const completedResult = await db.get(
            `SELECT COUNT(DISTINCT r.story_id) as count
             FROM reviews r
             JOIN user_stories us ON r.story_id = us.id
             WHERE r.tester_id = ? AND us.dataset_id = ?`,
            [testerId, activeDatasetId]
        );
        const completedCount = completedResult?.count || 0;

        // Count total stories in the active dataset
        const totalResult = await db.get(
            "SELECT COUNT(*) as count FROM user_stories WHERE dataset_id = ?",
            [activeDatasetId]
        );
        const totalCount = totalResult?.count || 0;

        const reviewsLeft = Math.max(0, totalCount - completedCount); // Ensure not negative

        console.log(`Dashboard stats for ${email} (TID: ${testerId}, DSID: ${activeDatasetId}): Completed=${completedCount}, Total=${totalCount}, Left=${reviewsLeft}`);

        return NextResponse.json({
            success: true,
            data: {
                completed: completedCount,
                total: totalCount,
                left: reviewsLeft
            }
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch dashboard statistics",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    } finally {
        if (db) {
            await db.close();
        }
    }
}