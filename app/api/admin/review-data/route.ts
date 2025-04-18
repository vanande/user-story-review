import { NextResponse } from "next/server"
import { Pool } from "pg"

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') // 'details' or 'averages'

  try {
    const client = await pool.connect()
    try {
      if (mode === 'averages') {
        // Calculate average rating per story (using MySQL story IDs)
        // Note: We join reviews (PostgreSQL) with criterion_evaluations (PostgreSQL)
        // The story_id in reviews corresponds to the ID from the MySQL Issue table.
        const avgResult = await client.query(`
          SELECT 
            r.story_id, 
            AVG(ce.rating) as average_rating,
            COUNT(DISTINCT r.id) as review_count
          FROM reviews r
          JOIN criterion_evaluations ce ON r.id = ce.review_id
          GROUP BY r.story_id
          ORDER BY r.story_id;
        `)
        return NextResponse.json({ success: true, averages: avgResult.rows })
      } else {
        // Fetch detailed reviews (default mode)
        // Join reviews, testers, criterion_evaluations, and evaluation_criteria
        const detailsResult = await client.query(`
          SELECT 
            r.id as review_id,
            r.story_id,
            t.email as tester_email,
            r.additional_feedback,
            r.created_at,
            json_agg(json_build_object(
              'criterion', ec.name, 
              'rating', ce.rating
            )) as evaluations
          FROM reviews r
          JOIN testers t ON r.tester_id = t.id
          JOIN criterion_evaluations ce ON r.id = ce.review_id
          JOIN evaluation_criteria ec ON ce.criterion_id = ec.id
          GROUP BY r.id, t.email -- Group by review and tester
          ORDER BY r.created_at DESC;
        `)
        return NextResponse.json({ success: true, details: detailsResult.rows })
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching review data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch review data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
} 