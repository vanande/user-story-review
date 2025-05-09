import { NextResponse } from "next/server";
import { openDb } from "@/lib/db";

const periodMap: { [key: string]: string } = {
  "5m": "-5 minutes",
  "30m": "-30 minutes",
  "1h": "-1 hour",
  "3h": "-3 hours",
  "6h": "-6 hours",
  "24h": "-24 hours",
  all: "-1 years",
};

export async function GET(request: Request) {
  let db;
  try {
    db = await openDb();
    const { searchParams } = new URL(request.url);
    const periodKey = searchParams.get("period") || "1h";
    const timeModifier = periodMap[periodKey] || periodMap["1h"];

    const query = `
            SELECT
                r.id as reviewId,
                r.submitted_at AS submittedAt,
                COALESCE(t.name, t.email) AS testerName,
                s.title AS storyTitle,  -- Long title/description
                s.id as storyId,
                s.source_key,           -- Added
                s.epic_name,            -- Added
                t.id as testerId
            FROM reviews r
                     JOIN testers t ON r.tester_id = t.id
                     JOIN user_stories s ON r.story_id = s.id
            WHERE r.submitted_at >= datetime('now', ?)
            ORDER BY r.submitted_at DESC
        `;

    const recentReviews = await db.all(query, [timeModifier]);

    console.log(`Fetched ${recentReviews.length} recent reviews for period '${periodKey}'.`);
    return NextResponse.json({ success: true, data: recentReviews });
  } catch (error) {
    console.error("Error fetching recent reviews:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch recent reviews",
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
