import { NextResponse } from "next/server";
import { openDb } from "@/lib/db";

export async function GET(request: Request) {
  let db;
  try {
    db = await openDb();
    const { searchParams } = new URL(request.url);
    const principleIdParam = searchParams.get("principleId"); // This is the string name like 'independent'

    let criterionId: number | null = null;
    if (principleIdParam) {
      // Find the criterion ID from the name
      const criterion = await db.get("SELECT id FROM evaluation_criteria WHERE LOWER(name) = ?", [principleIdParam.toLowerCase()]);
      criterionId = criterion?.id || null;
      if (!criterionId) {
        console.warn(`Criterion not found for name: ${principleIdParam}`);
        // Return empty if invalid principle filter? Or ignore filter? Let's return empty.
        return NextResponse.json({ success: true, data: [] });
      }
    }


    let query = `
      SELECT
          s.id AS storyId,
          s.title AS storyTitle,
          ec.id AS principleIdNum, -- Numeric ID
          ec.name AS principleName,
          COUNT(ce.id) AS totalReviews,
          AVG(ce.rating) AS averageRating,
          SUM(CASE WHEN ce.rating >= 4 THEN 1 ELSE 0 END) AS meetsCriteria -- Assuming >=4 meets criteria
      FROM user_stories s
      LEFT JOIN reviews r ON s.id = r.story_id
      LEFT JOIN criterion_evaluations ce ON r.id = ce.review_id
      LEFT JOIN evaluation_criteria ec ON ce.criterion_id = ec.id
      WHERE s.dataset_id = (SELECT id FROM datasets WHERE is_active = 1 LIMIT 1) -- Only show stats for active dataset
    `;

    const params: any[] = [];

    if (criterionId) {
      // Filter by the specific criterion if provided
      query += ` AND ec.id = ?`;
      params.push(criterionId);
    }
    // If no criterion filter, it calculates stats across all principles for each story

    query += ` GROUP BY s.id, s.title, ec.id, ec.name ORDER BY s.title, ec.name`;

    const stats = await db.all(query, params);

    // Add a unique string ID for the frontend key prop
    const formattedStats = stats.map((stat, index) => ({
      ...stat,
      averageRating: stat.averageRating || 0, // Handle potential null if no reviews
      meetsCriteria: stat.meetsCriteria || 0,
      id: `storystat-${stat.storyId}-${stat.principleName || 'all'}-${index}`,
      principleId: stat.principleName?.toLowerCase() // Use lowercase name as string ID
    }));


    console.log(`Fetched ${formattedStats.length} story stats from DB.`);
    return NextResponse.json({ success: true, data: formattedStats });

  } catch (error) {
    console.error("Error fetching story statistics from database:", error);
    return NextResponse.json(
        {
          error: "Failed to fetch story statistics",
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