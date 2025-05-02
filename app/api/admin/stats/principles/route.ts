
import { NextResponse } from "next/server";
import { openDb } from "@/lib/db";

export async function GET(request: Request) {
  let db;
  try {
    db = await openDb();
    const { searchParams } = new URL(request.url);
    const storyIdParam = searchParams.get("storyId");
    const storyIdFilter = storyIdParam ? parseInt(storyIdParam, 10) : null;

    let query = `
      SELECT
        ec.id AS principleId, -- Use numeric ID from DB
        ec.name AS principleName,
        s.id AS storyId,        -- Added story ID
        s.title AS storyTitle,  -- This is the long title/description
        s.source_key,           -- Added
        s.epic_name,            -- Added
        COUNT(ce.id) AS totalReviews,
        SUM(CASE WHEN ce.rating = 5 THEN 1 ELSE 0 END) AS yesCount,
        SUM(CASE WHEN ce.rating = 3 THEN 1 ELSE 0 END) AS partialCount,
        SUM(CASE WHEN ce.rating = 1 THEN 1 ELSE 0 END) AS noCount
      FROM evaluation_criteria ec
             LEFT JOIN criterion_evaluations ce ON ec.id = ce.criterion_id
             LEFT JOIN reviews r ON ce.review_id = r.id
             LEFT JOIN user_stories s ON r.story_id = s.id
      -- Optional: Filter by active dataset?
      -- WHERE s.dataset_id = (SELECT id FROM datasets WHERE is_active = 1 LIMIT 1)
    `;

    const params: any[] = [];

    if (storyIdFilter && !isNaN(storyIdFilter)) {
      query += (query.includes("WHERE") ? " AND" : " WHERE") + ` s.id = ?`;
      params.push(storyIdFilter);
    }

    query += ` GROUP BY ec.id, ec.name, s.id, s.title, s.source_key, s.epic_name ORDER BY s.id, ec.id`;

    const stats = await db.all(query, params);

    const formattedStats = stats.map((stat, index) => ({
      ...stat,
      id: `principlestat-${stat.principleName}-${stat.storyId || 'all'}-${index}`,
      principleStringId: stat.principleName?.toLowerCase()
    }));

    console.log(`Fetched ${formattedStats.length} principle stats from DB.`);
    return NextResponse.json({ success: true, data: formattedStats });

  } catch (error) {
    console.error("Error fetching principle statistics from database:", error);
    return NextResponse.json(
        { error: "Failed to fetch principle statistics", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
    );
  } finally {
    if (db) { await db.close(); }
  }
}