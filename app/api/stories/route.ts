import { NextResponse } from "next/server";
import { openDb, getActiveDatasetId } from "@/lib/db";
import { UserStory } from "@/lib/types";

export async function GET(request: Request) {
  let db;
  try {
    db = await openDb();

    const activeDatasetId = await getActiveDatasetId(db);

    if (!activeDatasetId) {
      console.error("No active dataset found in the database.");
      return NextResponse.json({ error: "No active dataset configured" }, { status: 500 });
    }
    console.log(`Fetching stories for active dataset ID: ${activeDatasetId}`);

    // Get the tester email from the request parameters
    const { searchParams } = new URL(request.url);
    const testerEmail = searchParams.get("testerId");

    if (!testerEmail) {
      return NextResponse.json({ error: "Tester email is required" }, { status: 400 });
    }

    // Get or create tester
    let testerId: number;
    const tester = await db.get("SELECT id FROM testers WHERE LOWER(email) = LOWER(?)", [testerEmail]);
    if (!tester) {
      const testerName = testerEmail.split("@")[0];
      const result = await db.run("INSERT INTO testers (email, name) VALUES (?, ?)", [
        testerEmail,
        testerName,
      ]);
      if (!result.lastID) {
        throw new Error("Failed to create tester record");
      }
      testerId = result.lastID;
    } else {
      if (!tester.id) {
        throw new Error("Invalid tester record");
      }
      testerId = tester.id;
    }

    // First, get all stories that haven't been reviewed by this tester
    const storiesQuery = `
      WITH StoryReviewCounts AS (
        SELECT 
          s.id,
          COUNT(r.id) as review_count
        FROM user_stories s
        LEFT JOIN reviews r ON s.id = r.story_id
        WHERE s.dataset_id = ?
        GROUP BY s.id
      )
      SELECT
        s.id,
        s.dataset_id,
        s.title,
        s.description,
        s.acceptance_criteria,
        s.source_key,
        s.epic_name,
        s.epic_id,
        s.independent,
        s.negotiable,
        s.valuable,
        s.estimable,
        s.small,
        s.testable,
        COALESCE(src.review_count, 0) as review_count
      FROM user_stories s
      LEFT JOIN StoryReviewCounts src ON s.id = src.id
      WHERE s.dataset_id = ?
      AND s.id NOT IN (
        SELECT story_id 
        FROM reviews 
        WHERE tester_id = ?
      )
      ORDER BY src.review_count ASC, RANDOM()
    `;

    const storiesFromDb = await db.all(storiesQuery, [activeDatasetId, activeDatasetId, testerId]);

    // Take up to 5 stories
    const selectedStories: UserStory[] = storiesFromDb.slice(0, 5).map((story) => ({
      id: story.id,
      datasetId: story.dataset_id,
      title: story.title,
      description: story.description,
      acceptance_criteria: story.acceptance_criteria ? JSON.parse(story.acceptance_criteria) : [],
      source_key: story.source_key,
      epic_name: story.epic_name,
      epicId: story.epic_id,
      independent: story.independent === null ? null : Boolean(story.independent),
      negotiable: story.negotiable === null ? null : Boolean(story.negotiable),
      valuable: story.valuable === null ? null : Boolean(story.valuable),
      estimable: story.estimable === null ? null : Boolean(story.estimable),
      small: story.small === null ? null : Boolean(story.small),
      testable: story.testable === null ? null : Boolean(story.testable),
    }));

    console.log(
      `Fetched ${selectedStories.length} stories from DB (Dataset ID: ${activeDatasetId}).`
    );

    return NextResponse.json({
      success: true,
      stories: selectedStories,
    });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch stories",
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
