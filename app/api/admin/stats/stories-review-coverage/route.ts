import { NextResponse, NextRequest } from "next/server";
import { openDb, getActiveDatasetId } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const adminCheckResponse = await checkAdminAuth(request);
  if (adminCheckResponse) {
    console.warn(
      "WARNING: Admin check skipped for /api/admin/stats/stories-review-coverage endpoint."
    );
  }

  let db;
  try {
    db = await openDb();
    const activeDatasetId = await getActiveDatasetId(db);

    if (!activeDatasetId) {
      await db.close();

      return NextResponse.json({ percentage: 0, totalStories: 0, storiesWithMultipleReviews: 0 });
    }

    console.log(`Fetching story review coverage for active dataset ID: ${activeDatasetId}`);

    const result = await db.get(
      `
            WITH StoryReviewCounts AS (
                SELECT
                    s.id as story_id,
                    COUNT(r.id) as review_count
                FROM user_stories s
                         LEFT JOIN reviews r ON s.id = r.story_id
                WHERE s.dataset_id = ?
                GROUP BY s.id
            )
            SELECT
                COUNT(story_id) as total_stories,
                SUM(CASE WHEN review_count >= 1 THEN 1 ELSE 0 END) as stories_with_multiple_reviews
            FROM StoryReviewCounts;
        `,
      activeDatasetId
    );

    await db.close();

    const totalStories = result?.total_stories ?? 0;
    const storiesWithMultipleReviews = result?.stories_with_multiple_reviews ?? 0;

    const percentage = totalStories > 0 ? (storiesWithMultipleReviews / totalStories) * 100 : 0;

    return NextResponse.json({
      percentage: parseFloat(percentage.toFixed(1)),
      totalStories: totalStories,
      storiesWithMultipleReviews: storiesWithMultipleReviews,
    });
  } catch (error: any) {
    console.error("Failed to fetch stories review coverage:", error);
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error("Error closing DB after coverage fetch error:", closeError);
      }
    }
    return NextResponse.json(
      { error: "Failed to fetch stories review coverage", details: error.message },
      { status: 500 }
    );
  }
}
