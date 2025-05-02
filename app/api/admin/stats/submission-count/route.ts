import { NextResponse } from "next/server";
import { openDb, getActiveDatasetId } from "@/lib/db";

export async function GET() {
  let db;
  try {
    db = await openDb();

    const activeDatasetId = await getActiveDatasetId(db);
    if (!activeDatasetId) {
      console.warn("Counts API: No active dataset found.");
      return NextResponse.json({
        success: true,
        data: { totalReviews: 0, uniqueStoriesReviewed: 0 },
      });
    }

    const totalReviewsResult = await db.get(
      `SELECT COUNT(r.id) as count
             FROM reviews r
             JOIN user_stories us ON r.story_id = us.id
             WHERE us.dataset_id = ?`,
      [activeDatasetId]
    );
    const totalReviewsCount = totalReviewsResult?.count || 0;

    const uniqueStoriesResult = await db.get(
      `SELECT COUNT(DISTINCT r.story_id) as count
              FROM reviews r
              JOIN user_stories us ON r.story_id = us.id
              WHERE us.dataset_id = ?`,
      [activeDatasetId]
    );
    const uniqueStoriesReviewedCount = uniqueStoriesResult?.count || 0;

    console.log(
      `Counts API for Dataset ${activeDatasetId}: Total Reviews=${totalReviewsCount}, Unique Stories=${uniqueStoriesReviewedCount}`
    );

    return NextResponse.json({
      success: true,
      data: {
        totalReviews: totalReviewsCount,
        uniqueStoriesReviewed: uniqueStoriesReviewedCount,
      },
    });
  } catch (error) {
    console.error("Error fetching admin counts:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch counts",
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
