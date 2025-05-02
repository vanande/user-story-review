import { NextResponse } from "next/server";
import { openDb, getActiveDatasetId } from "@/lib/db";
import { UserStory } from "@/lib/types";

export async function GET() {
  let db;
  try {
    db = await openDb();

    const activeDatasetId = await getActiveDatasetId(db);

    if (!activeDatasetId) {
      console.error("No active dataset found in the database.");
      return NextResponse.json({ error: "No active dataset configured" }, { status: 500 });
    }
    console.log(`Fetching stories for active dataset ID: ${activeDatasetId}`);

    const storiesFromDb = await db.all(
      `SELECT
           id, title, description, acceptance_criteria, independent, negotiable, valuable, estimable, small, testable,
           source_key, epic_name -- Added new fields
       FROM user_stories
       WHERE dataset_id = ?
       ORDER BY RANDOM()
       LIMIT 5`,
      [activeDatasetId]
    );

    const selectedStories: UserStory[] = storiesFromDb.map((story) => ({
      id: story.id,
      title: story.title,
      description: story.description,
      acceptance_criteria: story.acceptance_criteria ? JSON.parse(story.acceptance_criteria) : [],
      source_key: story.source_key,
      epic_name: story.epic_name,

      independent: story.independent === null ? null : Boolean(story.independent),
      negotiable: story.negotiable === null ? null : Boolean(story.negotiable),
      valuable: story.valuable === null ? null : Boolean(story.valuable),
      estimable: story.estimable === null ? null : Boolean(story.estimable),
      small: story.small === null ? null : Boolean(story.small),
      testable: story.testable === null ? null : Boolean(story.testable),
    }));

    console.log(
      `Fetched ${selectedStories.length} random stories from DB (Dataset ID: ${activeDatasetId}).`
    );

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
      await db.close();
    }
  }
}
