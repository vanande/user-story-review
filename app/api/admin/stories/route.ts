
import { NextResponse } from "next/server";
import { openDb } from "@/lib/db";


const principleStringToIdMap: { [key: string]: number } = {
  independent: 1, negotiable: 2, valuable: 3, estimable: 4, small: 5, testable: 6,
};


export async function GET(request: Request) {
  let db;
  try {
    db = await openDb();
    const { searchParams } = new URL(request.url);
    const principleIdParam = searchParams.get("principleId");

    let criterionIdFilter: number | null = null;
    if (principleIdParam) {
      criterionIdFilter = principleStringToIdMap[principleIdParam.toLowerCase()] || null;
      if (!criterionIdFilter) {
        console.warn(`Story Stats: Criterion not found for name: ${principleIdParam}`);
        return NextResponse.json({ success: true, data: [] });
      }
    }

    let query = `
      SELECT
          s.id AS storyId,
          s.title AS storyTitle,      -- Long title/description
          s.source_key,               -- Added
          s.epic_name,                -- Added
          ec.id AS principleIdNum,    -- Numeric ID
          ec.name AS principleName,
          COUNT(ce.id) AS totalReviews,
          AVG(ce.rating) AS averageRating,
          SUM(CASE WHEN ce.rating >= 4 THEN 1 ELSE 0 END) AS meetsCriteria
      FROM user_stories s
      LEFT JOIN reviews r ON s.id = r.story_id
      LEFT JOIN criterion_evaluations ce ON r.id = ce.review_id
      LEFT JOIN evaluation_criteria ec ON ce.criterion_id = ec.id
      WHERE s.dataset_id = (SELECT id FROM datasets WHERE is_active = 1 LIMIT 1) -- Only active dataset
    `;

    const params: any[] = [];

    if (criterionIdFilter) {
      query += ` AND ec.id = ?`;
      params.push(criterionIdFilter);
    }


    query += ` GROUP BY s.id, s.title, s.source_key, s.epic_name, ec.id, ec.name ORDER BY s.id, ec.name`;

    const stats = await db.all(query, params);


    const formattedStats = stats.map((stat, index) => ({
      ...stat,
      averageRating: stat.averageRating || 0,
      meetsCriteria: stat.meetsCriteria || 0,
      totalReviews: stat.totalReviews || 0,
      id: `storystat-${stat.storyId}-${stat.principleName || 'all'}-${index}`,
      principleId: stat.principleName?.toLowerCase()
    }));

    console.log(`Fetched ${formattedStats.length} story stats from DB.`);
    return NextResponse.json({ success: true, data: formattedStats });

  } catch (error) {
    console.error("Error fetching story statistics from database:", error);
    return NextResponse.json(
        { error: "Failed to fetch story statistics", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
    );
  } finally {
    if (db) { await db.close(); }
  }
}