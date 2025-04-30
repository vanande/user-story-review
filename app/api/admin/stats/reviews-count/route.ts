// app/api/admin/stats/reviews-count/route.ts
import { NextResponse } from "next/server";
import { openDb, getActiveDatasetId } from "@/lib/db";

export async function GET(request: Request) {
    let db;
    try {
        db = await openDb();
        const { searchParams } = new URL(request.url);
        // Optional: Add filtering by dataset? Default to active dataset.
        const filterByActiveDataset = searchParams.get("activeDatasetOnly") !== 'false'; // Default true

        let query = `SELECT COUNT(*) as count FROM reviews`;
        const params: any[] = [];

        if (filterByActiveDataset) {
            const activeDatasetId = await getActiveDatasetId(db);
            if (activeDatasetId) {
                // Join with user_stories to filter by active dataset
                query = `SELECT COUNT(r.id) as count
                         FROM reviews r
                         JOIN user_stories us ON r.story_id = us.id
                         WHERE us.dataset_id = ?`;
                params.push(activeDatasetId);
            } else {
                console.warn("Review Count: No active dataset found, counting all reviews.");
                // Stick to the original query counting all reviews if no active dataset
            }
        }

        const result = await db.get(query, params);
        const count = result?.count ?? 0;

        console.log(`Fetched review count: ${count}` + (filterByActiveDataset ? ` (Active Dataset)`: ` (All Datasets)`));

        return NextResponse.json({ success: true, data: { count: count } });

    } catch (error) {
        console.error("Error fetching total reviews count:", error);
        return NextResponse.json(
            { error: "Failed to fetch total reviews count", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    } finally {
        if (db) { await db.close(); }
    }
}