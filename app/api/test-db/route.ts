import { NextResponse } from "next/server"
import { Pool } from "pg"

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET() {
  try {
    console.log("Testing database connection...")
    console.log("DATABASE_URL:", process.env.DATABASE_URL)

    // Test the connection
    const client = await pool.connect()

    try {
      // Check if the tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `)

      const tables = tablesResult.rows.map((row) => row.table_name)
      console.log("Available tables:", tables)

      // Check if we have any user stories
      const storiesResult = await client.query("SELECT COUNT(*) FROM user_stories")
      const storiesCount = storiesResult.rows[0].count
      console.log("User stories count:", storiesCount)

      // Check if we have any evaluation criteria
      const criteriaResult = await client.query("SELECT COUNT(*) FROM evaluation_criteria")
      const criteriaCount = criteriaResult.rows[0].count
      console.log("Evaluation criteria count:", criteriaCount)

      return NextResponse.json({
        success: true,
        message: "Database connection successful",
        tables,
        storiesCount,
        criteriaCount,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error testing database connection:", error)
    return NextResponse.json(
      {
        error: "Failed to connect to database",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
