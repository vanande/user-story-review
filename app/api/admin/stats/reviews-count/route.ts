import { NextResponse } from "next/server";
import { openDb, getActiveDatasetId } from "@/lib/db";

export async function GET(request: Request) {
  let db;
  try {
    db = await openDb();
    const { searchParams } = new URL(request.url);

    const filterByActiveDataset = searchParams.get("activeDatasetOnly") !== "false";

    let query = `SELECT COUNT(*) as count FROM reviews`;
    const params: any[] = [];

    if (filterByActiveDataset) {
      const activeDatasetId = await getActiveDatasetId(db);
      if (activeDatasetId) {
        query = `SELECT COUNT(r.id) as count
                         FROM reviews r
                         JOIN user_stories us ON r.story_id = us.id
                         WHERE us.dataset_id = ?`;
        params.push(activeDatasetId);
      } else {
        console.warn("Review Count: No active dataset found, counting all reviews.");
      }
    }

    const result = await db.get(query, params);
    const count = result?.count ?? 0;

    console.log(
      `Fetched review count: ${count}` +
        (filterByActiveDataset ? ` (Active Dataset)` : ` (All Datasets)`)
    );

    return NextResponse.json({ success: true, data: { count: count } });
  } catch (error) {
    console.error("Error fetching total reviews count:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch total reviews count",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    if (db) {
      await db.close();
    }
  }
}
