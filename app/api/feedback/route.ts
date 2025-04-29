import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import path from "path";
import { open } from "sqlite";

const DB_FILE_PATH = path.join(process.cwd(), "data", "reviews.db");

const ratingMap: { [key: string]: number } = {
  yes: 5,
  partial: 3,
  no: 1,
};

async function openDb() {
  return open({
    filename: DB_FILE_PATH,
    driver: sqlite3.Database,
  });
}

export async function POST(request: Request) {
  let db;
  try {
    const data = await request.json();
    console.log("Received feedback data:", data);

    // Validate incoming data (unchanged)
    if (!data.storyId || !data.evaluations || !data.email) {
      console.error("Missing required fields:", data);
      return NextResponse.json({ error: "Missing required fields (storyId, evaluations, email)" }, { status: 400 });
    }

    const testerEmail = data.email;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testerEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    db = await openDb();

    // Start transaction
    await db.exec("BEGIN TRANSACTION");
    console.log("SQLite transaction started.");

    try {
      let testerId: number | undefined;
      let tester = await db.get("SELECT id FROM testers WHERE email = ?", [testerEmail]);

      if (!tester) {
        const testerName = testerEmail.split('@')[0]; // Use email prefix as name
        const result = await db.run(
            "INSERT INTO testers (email, name) VALUES (?, ?)",
            [testerEmail, testerName]
        );
        testerId = result.lastID;
        console.log(`Created new tester with ID: ${testerId}`);
      } else {
        testerId = tester.id;
        console.log(`Found existing tester with ID: ${testerId}`);
      }

      if (!testerId) {
        throw new Error("Failed to get tester ID.");
      }

      // --- Insert the review ---
      const reviewResult = await db.run(
          `INSERT INTO reviews (story_id, tester_id, additional_feedback)
             VALUES (?, ?, ?)`,
          [data.storyId, testerId, data.additionalFeedback || ""]
      );

      const reviewId = reviewResult.lastID;
      if (!reviewId) {
        throw new Error("Failed to insert review or get review ID.");
      }
      console.log(`Created review with ID: ${reviewId}`);

      // --- Insert each criterion evaluation ---
      const criteriaMap = new Map<string, number>();
      const criteria = await db.all("SELECT id, name FROM evaluation_criteria");
      criteria.forEach(c => criteriaMap.set(c.name, c.id));

      for (const [criterionName, ratingStr] of Object.entries(data.evaluations)) {
        if (!(ratingStr && typeof ratingStr === 'string' && ratingMap[ratingStr.toLowerCase()])) {
          console.warn(`Invalid or missing rating '${ratingStr}' for criterion ${criterionName}. Skipping.`);
          continue;
        }
        const ratingInt = ratingMap[ratingStr.toLowerCase()];

        const criterionId = criteriaMap.get(criterionName);

        if (!criterionId) {
          console.error(`Unknown criterion: ${criterionName}`);
          // Rollback and return error if a criterion is unknown
          await db.exec("ROLLBACK TRANSACTION");
          return NextResponse.json({ error: `Unknown criterion: ${criterionName}` }, { status: 400 });
        }

        console.log(`Processing criterion: ${criterionName} (ID: ${criterionId}) with rating: ${ratingStr} (${ratingInt})`);

        await db.run(
            `INSERT INTO criterion_evaluations (review_id, criterion_id, rating)
                 VALUES (?, ?, ?)`,
            [reviewId, criterionId, ratingInt]
        );
        console.log(`Inserted evaluation for criterion: ${criterionName}`);
      }

      // Commit the transaction
      await db.exec("COMMIT TRANSACTION");
      console.log("SQLite transaction committed successfully");

      return NextResponse.json(
          {
            success: true,
            message: "Feedback stored successfully",
            reviewId,
          },
          { status: 201 }
      );
    } catch (err) {
      // Rollback in case of error during transaction
      console.error("Error in transaction, rolling back:", err);
      await db.exec("ROLLBACK TRANSACTION");
      throw err; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    // Outer catch block for connection errors or re-thrown transaction errors
    console.error("Error processing feedback:", error);
    return NextResponse.json(
        {
          error: "Failed to process feedback",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
    );
  } finally {
    if (db) {
      await db.close();
      console.log("SQLite database connection closed.");
    }
  }
}