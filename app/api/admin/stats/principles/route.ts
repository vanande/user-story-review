import { NextResponse } from "next/server";
import { openDb } from "@/lib/db";

export async function GET(request: Request) {
  let db;
  try {
    db = await openDb();
    const { searchParams } = new URL(request.url);
    const storyIdParam = searchParams.get("storyId");
    const storyId = storyIdParam ? parseInt(storyIdParam, 10) : null;

    let query = `
        SELECT
            ec.id AS principleIdStr, -- Use criterion ID as base for unique key if needed
            ec.name AS principleName,
            s.id AS storyId,
            s.title AS storyTitle,
            COUNT(ce.id) AS totalReviews, -- Total evaluations for this criterion/story combo
            SUM(CASE WHEN ce.rating = 5 THEN 1 ELSE 0 END) AS yesCount,
            SUM(CASE WHEN ce.rating = 3 THEN 1 ELSE 0 END) AS partialCount,
            SUM(CASE WHEN ce.rating = 1 THEN 1 ELSE 0 END) AS noCount
            -- Note: SQLite doesn't have native string aggregation like string_agg or json_agg easily
        FROM evaluation_criteria ec
        LEFT JOIN criterion_evaluations ce ON ec.id = ce.criterion_id
        LEFT JOIN reviews r ON ce.review_id = r.id
        LEFT JOIN user_stories s ON r.story_id = s.id
    `;

    const params: any[] = [];

    if (storyId && !isNaN(storyId)) {
      query += ` WHERE s.id = ?`;
      params.push(storyId);
    } else {
      // If no story filter, maybe only show stats for active dataset? Or all?
      // Let's fetch for all stories for now if no filter.
      // Add WHERE s.dataset_id = (SELECT id FROM datasets WHERE is_active = 1 LIMIT 1) if needed
    }

    query += ` GROUP BY ec.id, ec.name, s.id, s.title ORDER BY s.title, ec.id`;

    const stats = await db.all(query, params);

    // Add a unique string ID for the frontend key prop (can use combo of principle/story id)
    const formattedStats = stats.map((stat, index) => ({
      ...stat,
      id: `principlestat-${stat.principleName}-${stat.storyId || 'all'}-${index}`,
      principleId: stat.principleName.toLowerCase() // Use lowercase name as string ID
    }));


    console.log(`Fetched ${formattedStats.length} principle stats from DB.`);
    return NextResponse.json({ success: true, data: formattedStats });

  } catch (error) {
    console.error("Error fetching principle statistics from database:", error);
    return NextResponse.json(
        {
          error: "Failed to fetch principle statistics",
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
