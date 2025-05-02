import { NextResponse } from "next/server";
import { openDb } from "@/lib/db";

export async function GET() {
  let db;
  try {
    db = await openDb();

    const query = `
        SELECT
            ar.id,
            ar.tester_id AS testerId,
            COALESCE(t.name, t.email) AS testerName,
            ar.story_id AS storyId,
            us.title AS storyTitle,
            ar.started_at AS startedAt,
            ar.progress
            -- ar.completed_principles -- Can be fetched if needed, remember it's JSON string
        FROM active_review_sessions ar
        JOIN testers t ON ar.tester_id = t.id
        JOIN user_stories us ON ar.story_id = us.id
        ORDER BY ar.last_activity DESC
    `;

    const activeReviews = await db.all(query);

    console.log(`Fetched ${activeReviews.length} active reviews from DB.`);
    return NextResponse.json({ success: true, data: activeReviews });
  } catch (error) {
    console.error("Error fetching active reviews from database:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch active reviews",
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
