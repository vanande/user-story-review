import { NextResponse } from "next/server"
import { Pool } from "pg"

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Rating mapping
const ratingMap: { [key: string]: number } = {
  yes: 5,
  partial: 3,
  no: 1,
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("Received feedback data:", data)

    // Validate the incoming data
    if (!data.storyId || !data.evaluations || !data.email) {
      console.error("Missing required fields:", data)
      return NextResponse.json({ error: "Missing required fields (storyId, evaluations, email)" }, { status: 400 })
    }

    // Use email from request, validate format (basic)
    const testerEmail = data.email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testerEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Start a database transaction
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      // Find or create the tester based on email
      let testerId: number | null = null
      const testerResult = await client.query(
        "SELECT id FROM testers WHERE email = $1 LIMIT 1",
        [testerEmail],
      )

      if (testerResult.rows.length === 0) {
        // Create tester if not found (name can be derived or left null initially)
        const newTesterResult = await client.query(
          // Changed to use email from data, name can be null or derived
          "INSERT INTO testers (email, name) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id",
          [testerEmail, testerEmail.split('@')[0]], // Use email prefix as name for now
        )
        if (newTesterResult.rows.length > 0) {
          testerId = newTesterResult.rows[0].id
        } else {
          // If ON CONFLICT DO UPDATE happened, fetch the ID again
          const existingTester = await client.query("SELECT id FROM testers WHERE email = $1 LIMIT 1", [testerEmail])
          if (existingTester.rows.length > 0) {
            testerId = existingTester.rows[0].id
          } else {
            throw new Error("Failed to find or create tester.") // Should not happen
          }
        }
      } else {
        testerId = testerResult.rows[0].id
      }

      // 1. Insert the review
      const reviewResult = await client.query(
        `INSERT INTO reviews (story_id, tester_id, additional_feedback) 
         VALUES ($1, $2, $3) RETURNING id`,
        [data.storyId, testerId, data.additionalFeedback || ""],
      )

      const reviewId = reviewResult.rows[0].id
      console.log("Created review with ID:", reviewId)

      // 2. Insert each criterion evaluation
      for (const [criterionName, ratingStr] of Object.entries(data.evaluations)) {
        // Validate rating string
        if (!(ratingStr && typeof ratingStr === 'string' && ratingMap[ratingStr.toLowerCase()])) {
          console.warn(`Invalid or missing rating '${ratingStr}' for criterion ${criterionName}. Skipping.`)
          continue // Skip this evaluation if rating is invalid
        }
        const ratingInt = ratingMap[ratingStr.toLowerCase()] // Convert rating string to integer

        console.log(`Processing criterion: ${criterionName} with rating: ${ratingStr} (${ratingInt})`)

        // Get the criterion ID by name
        const criterionResult = await client.query("SELECT id FROM evaluation_criteria WHERE name = $1", [
          criterionName,
        ])

        if (criterionResult.rows.length === 0) {
          console.error(`Unknown criterion: ${criterionName}`)
          // Instead of throwing, maybe log and continue? Or handle as needed.
          await client.query("ROLLBACK") // Rollback if a criterion is unknown
          client.release()
          return NextResponse.json({ error: `Unknown criterion: ${criterionName}` }, { status: 400 })
        }

        const criterionId = criterionResult.rows[0].id
        console.log(`Found criterion ID: ${criterionId} for name: ${criterionName}`)

        // Insert the evaluation with the integer rating
        await client.query(
          `INSERT INTO criterion_evaluations (review_id, criterion_id, rating) 
           VALUES ($1, $2, $3)`,
          [reviewId, criterionId, ratingInt], // Use integer rating
        )
        console.log(`Inserted evaluation for criterion: ${criterionName}`)
      }

      // Commit the transaction
      await client.query("COMMIT")
      console.log("Transaction committed successfully")

      return NextResponse.json(
        {
          success: true,
          message: "Feedback stored successfully",
          reviewId,
        },
        { status: 201 },
      )
    } catch (err) {
      // Rollback in case of error
      console.error("Error in transaction:", err)
      await client.query("ROLLBACK")
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error processing feedback:", error)
    return NextResponse.json(
      {
        error: "Failed to process feedback",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
