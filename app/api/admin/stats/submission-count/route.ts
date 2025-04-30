// app/api/admin/stats/counts/route.ts
import { NextResponse } from "next/server";
import { openDb, getActiveDatasetId } from "@/lib/db";

export async function GET() {
    let db;
    try {
        db = await openDb();

        // Get active dataset ID to filter counts
        const activeDatasetId = await getActiveDatasetId(db);
        if (!activeDatasetId) {
            // Decide how to handle counts if no dataset is active
            // Option 1: Return 0 counts
            console.warn("Counts API: No active dataset found.");
            return NextResponse.json({ success: true, data: { totalReviews: 0, uniqueStoriesReviewed: 0 } });
            // Option 2: Count across all datasets (remove WHERE clause below)
        }

        // Count total review submissions for the active dataset
        const totalReviewsResult = await db.get(
            `SELECT COUNT(r.id) as count
             FROM reviews r
             JOIN user_stories us ON r.story_id = us.id
             WHERE us.dataset_id = ?`,
            [activeDatasetId]
        );
        const totalReviewsCount = totalReviewsResult?.count || 0;

        // Optional: Also calculate unique stories reviewed (Option B) if needed elsewhere
        const uniqueStoriesResult = await db.get(
            `SELECT COUNT(DISTINCT r.story_id) as count
              FROM reviews r
              JOIN user_stories us ON r.story_id = us.id
              WHERE us.dataset_id = ?`,
            [activeDatasetId]
        );
        const uniqueStoriesReviewedCount = uniqueStoriesResult?.count || 0;


        console.log(`Counts API for Dataset ${activeDatasetId}: Total Reviews=${totalReviewsCount}, Unique Stories=${uniqueStoriesReviewedCount}`);

        return NextResponse.json({
            success: true,
            data: {
                totalReviews: totalReviewsCount, // This is Option C
                uniqueStoriesReviewed: uniqueStoriesReviewedCount // Option B
            }
        });

    } catch (error) {
        console.error("Error fetching admin counts:", error);
        return NextResponse.json(
            { error: "Failed to fetch counts", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    } finally {
        if (db) { await db.close(); }
    }
}