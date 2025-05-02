import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import path from "path";
import { open } from "sqlite";

const DB_FILE_PATH = path.join(process.cwd(), "data", "reviews.db");
const ratingMap: { [key: string]: number } = { yes: 5, partial: 3, no: 1 };

async function openDb() {
  /* ... as before ... */
  return open({ filename: DB_FILE_PATH, driver: sqlite3.Database });
}

export async function POST(request: Request) {
  let db;
  try {
    const data = await request.json();
    console.log("Received feedback data:", data);

    if (!data.storyId || !data.evaluations || !data.email) {
      return NextResponse.json(
        { error: "Missing required fields (storyId, evaluations, email)" },
        { status: 400 }
      );
    }
    const testerEmail = data.email;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testerEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    db = await openDb();
    await db.exec("BEGIN TRANSACTION");
    console.log("SQLite transaction started.");

    try {
      let testerId: number | undefined;
      const tester = await db.get("SELECT id FROM testers WHERE email = ?", [testerEmail]);
      if (!tester) {
        const testerName = testerEmail.split("@")[0];
        const result = await db.run("INSERT INTO testers (email, name) VALUES (?, ?)", [
          testerEmail,
          testerName,
        ]);
        testerId = result.lastID;
      } else {
        testerId = tester.id;
      }
      if (!testerId) throw new Error("Failed to get tester ID.");

      const submittedAtUTC = new Date().toISOString();

      const reviewResult = await db.run(
        `INSERT INTO reviews (story_id, tester_id, additional_feedback, submitted_at)
             VALUES (?, ?, ?, ?)`,

        [data.storyId, testerId, data.additionalFeedback || "", submittedAtUTC]
      );
      const reviewId = reviewResult.lastID;
      if (!reviewId) throw new Error("Failed to insert review or get review ID.");
      console.log(`Created review ID: ${reviewId} at ${submittedAtUTC}`);

      const criteriaMap = new Map<string, number>();
      const criteria = await db.all("SELECT id, name FROM evaluation_criteria");
      criteria.forEach((c) => criteriaMap.set(c.name, c.id));
      for (const [criterionName, ratingStr] of Object.entries(data.evaluations)) {
        const ratingInt = ratingMap[(ratingStr as string).toLowerCase()];
        const criterionId = criteriaMap.get(criterionName);
        if (!criterionId) {
          /* ... handle error, rollback ... */
          await db.exec("ROLLBACK TRANSACTION");
          return NextResponse.json(
            { error: `Unknown criterion: ${criterionName}` },
            { status: 400 }
          );
        }
        await db.run(
          `INSERT INTO criterion_evaluations (review_id, criterion_id, rating) VALUES (?, ?, ?)`,
          [reviewId, criterionId, ratingInt]
        );
      }

      await db.exec("COMMIT TRANSACTION");
      console.log("SQLite transaction committed successfully");
      return NextResponse.json(
        { success: true, message: "Feedback stored successfully", reviewId },
        { status: 201 }
      );
    } catch (err) {
      console.error("Error in transaction, rolling back:", err);
      await db.exec("ROLLBACK TRANSACTION");
      throw err;
    }
  } catch (error) {
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
