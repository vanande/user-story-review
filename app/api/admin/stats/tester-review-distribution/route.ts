import { NextResponse } from "next/server";
import { openDb, getActiveDatasetId } from "@/lib/db";

export async function GET() {
    
    let db;
    try {
        db = await openDb();
        const activeDatasetId = await getActiveDatasetId(db);

        if (!activeDatasetId) {
            await db.close();
            console.warn("Tester Distribution API: No active dataset found.");
            return NextResponse.json({ success: true, data: [] });
        }

        console.log(`Fetching tester review distribution for active dataset ID: ${activeDatasetId}`);

        // --- MODIFIED QUERY ---
        // Select email specifically, keep testerName for potential display elsewhere
        const query = `
            SELECT
                t.id as testerId,
                t.email as testerEmail,
                COALESCE(t.name, t.email) as testerName,
                COUNT(r.id) as reviewCount
            FROM testers t
                     JOIN reviews r ON t.id = r.tester_id
                     JOIN user_stories us ON r.story_id = us.id
            WHERE us.dataset_id = ?
            GROUP BY t.id, t.email, COALESCE(t.name, t.email)
            ORDER BY reviewCount DESC;
        `;

        const distributionData = await db.all(query, [activeDatasetId]);

        await db.close();

        console.log(`Fetched distribution data for ${distributionData.length} testers.`);

        // Data now includes testerEmail
        return NextResponse.json({ success: true, data: distributionData });

    } catch (error: unknown) {
        console.error("Failed to fetch tester review distribution:", error);
        if (db) {
            try { await db.close(); } catch (closeError) { console.error("Error closing DB after distribution fetch error:", closeError); }
        }
        return NextResponse.json({ error: "Failed to fetch tester review distribution", details: error instanceof Error ? error.message : 'Unknown error'   }, { status: 500 });
    }
}