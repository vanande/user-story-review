const { Pool } = require("pg")
const fs = require("fs").promises // Use promise-based fs
const path = require("path")

const MAX_RETRIES = 10 // Maximum number of connection retries
const RETRY_DELAY = 5000 // Delay between retries in milliseconds (5 seconds)

// Database connection details (use environment variables)
const connectionString = process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/reviewdb"

async function connectWithRetry(retries = MAX_RETRIES) {
  let client
  for (let i = 0; i < retries; i++) {
    try {
      const pool = new Pool({ connectionString })
      client = await pool.connect() // Attempt to connect
      console.log("Successfully connected to PostgreSQL.")
      await pool.end() // Close the temporary pool used for connection testing
      return new Pool({ connectionString }) // Return a new pool for actual use
    } catch (err) {
      console.error(`Connection attempt ${i + 1} failed:`, err.message)
      if (i < retries - 1) {
        console.log(`Retrying connection in ${RETRY_DELAY / 1000} seconds...`)
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
      } else {
        console.error("Max connection retries reached. Exiting.")
        throw err // Re-throw the last error if all retries fail
      }
    }
  }
  throw new Error("Could not establish database connection after multiple retries.")
}

async function initializeDatabase() {
  let pool
  try {
    pool = await connectWithRetry() // Connect with retry logic
    const client = await pool.connect()

    try {
      console.log("Initializing database structure...")
      // Read and execute the init.sql script
      const sqlFilePath = path.join(__dirname, "..", "init.sql")
      console.log(`Attempting to read SQL file from: ${sqlFilePath}`)
      const sql = await fs.readFile(sqlFilePath, "utf8")
      console.log(`Successfully read SQL file. Length: ${sql.length}`)
      console.log("Attempting to execute SQL script...")
      await client.query(sql)
      console.log("Successfully executed SQL script.")
      console.log("Database structure initialized successfully (tables created/reset, criteria inserted)." + sqlFilePath)

      // --- Populate user_stories from merged.json ---
      console.log("Populating user_stories table from merged.json...")
      const jsonPath = path.join(__dirname, "..", "data", "merged.json")
      const jsonData = await fs.readFile(jsonPath, "utf-8")
      const data = JSON.parse(jsonData)

      let insertedCount = 0
      for (const sourceKey of Object.keys(data)) {
        const source = data[sourceKey]
        for (const epic of source.epics) {
          for (const story of epic.user_stories) {
            // Extract data, providing defaults for optional fields
            const title = story.user_story.substring(0, 70) + (story.user_story.length > 70 ? "..." : "")
            const description = story.user_story
            const acceptance_criteria = story.acceptance_criteria || []
            const independent = story.independent === undefined ? null : story.independent
            const negotiable = story.negotiable === undefined ? null : story.negotiable
            const valuable = story.valuable === undefined ? null : story.valuable
            const estimable = story.estimable === undefined ? null : story.estimable
            const small = story.small === undefined ? null : story.small
            const testable = story.testable === undefined ? null : story.testable

            try {
              await client.query(
                `INSERT INTO user_stories (title, description, acceptance_criteria, independent, negotiable, valuable, estimable, small, testable)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                  title,
                  description,
                  acceptance_criteria,
                  independent,
                  negotiable,
                  valuable,
                  estimable,
                  small,
                  testable,
                ],
              )
              insertedCount++
            } catch (insertError) {
              console.error(`Failed to insert story: "${title.substring(0, 30)}..."`, insertError.message)
              // Decide whether to continue or stop on error
            }
          }
        }
      }
      console.log(`Successfully inserted ${insertedCount} user stories from merged.json.`)
      // --- End of population logic ---

      // Verify final counts
      const userStoriesResult = await client.query("SELECT COUNT(*) FROM user_stories")
      const criteriaResult = await client.query("SELECT COUNT(*) FROM evaluation_criteria")
      console.log(`Final user stories count: ${userStoriesResult.rows[0].count}`)
      console.log(`Final evaluation criteria count: ${criteriaResult.rows[0].count}`)
    } catch (err) {
      console.error("Error during database initialization or population:", err)
      // Throw error to signal failure to the main catch block
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    // This catch block handles errors from connectWithRetry OR the inner try block
    console.error("Failed during database initialization process:", err)
    // Re-throw the error to be caught by the final .catch()
    throw err
  } finally {
    if (pool) {
      await pool.end() // Ensure pool is closed
      console.log("Database pool closed.")
    }
  }
}

// Run the initialization
initializeDatabase()
  .then(() => {
    console.log("Database initialization and population script finished successfully.")
  })
  .catch((err) => {
    console.error("Initialization script failed overall:", err)
    throw new Error("Database initialization failed.")
  })
