import { NextResponse } from "next/server";
import { openDb, getActiveDatasetId } from "@/lib/db"; // Import DB helpers
import { UserStory } from "@/lib/types"; // Assuming this type exists

// REMOVE: Filesystem imports if they were still here
// import fs from "fs/promises";
// import path from "path";

// REMOVE: shuffleArray function if present

export async function GET() {
  let db;
  try {
    db = await openDb();

    // 1. Find the active dataset
    const activeDatasetId = await getActiveDatasetId(db);

    if (!activeDatasetId) {
      console.error("No active dataset found in the database.");
      return NextResponse.json({ error: "No active dataset configured" }, { status: 500 });
    }
    console.log(`Fetching stories for active dataset ID: ${activeDatasetId}`);

    // 2. Fetch 5 random stories from the active dataset
    // SQLite uses RANDOM()
    const storiesFromDb = await db.all(
        `SELECT id, title, description, acceptance_criteria, independent, negotiable, valuable, estimable, small, testable
       FROM user_stories
       WHERE dataset_id = ?
       ORDER BY RANDOM()
       LIMIT 5`,
        [activeDatasetId]
    );

    // 3. Format the data (parse JSON strings, match UserStory type)
    const selectedStories: UserStory[] = storiesFromDb.map(story => ({
      ...story,
      acceptance_criteria: story.acceptance_criteria ? JSON.parse(story.acceptance_criteria) : [], // Parse JSON string
    }));

    console.log(`Fetched ${selectedStories.length} random stories from DB (Dataset ID: ${activeDatasetId}).`);

    return NextResponse.json({
      success: true,
      stories: selectedStories,
    });

  } catch (error) {
    console.error("Error fetching stories from database:", error);
    return NextResponse.json(
        {
          error: "Failed to fetch stories from database",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
    );
  } finally {
    if (db) {
      await db.close(); // Close connection
    }
  }
}