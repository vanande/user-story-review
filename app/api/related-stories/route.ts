import { NextResponse } from "next/server";
import { openDb } from "@/lib/db";
import { UserStory } from "@/lib/types";

export async function GET(request: Request) {
  let db;
  try {
    db = await openDb();
    const { searchParams } = new URL(request.url);

    const currentStoryIdStr = searchParams.get("currentStoryId");
    const datasetIdStr = searchParams.get("datasetId");
    const epicId = searchParams.get("epicId");
    const epicName = searchParams.get("epicName");
    const sourceKey = searchParams.get("sourceKey");

    if (!currentStoryIdStr || !datasetIdStr) {
      return NextResponse.json(
        { error: "currentStoryId and datasetId are required" },
        { status: 400 }
      );
    }

    const currentStoryId = parseInt(currentStoryIdStr, 10);
    const datasetId = parseInt(datasetIdStr, 10);

    if (isNaN(currentStoryId) || isNaN(datasetId)) {
      return NextResponse.json(
        { error: "Invalid currentStoryId or datasetId" },
        { status: 400 }
      );
    }

    let relatedStoriesQuery = "";
    const queryParams: (string | number)[] = [];

    const baseSelect = `
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
        s.testable
      FROM user_stories s
    `;

    if (epicId && epicId.trim() !== "") {
      relatedStoriesQuery = `
        ${baseSelect}
        WHERE s.dataset_id = ?
        AND s.epic_id = ?
        AND s.id != ?
      `;
      queryParams.push(datasetId, epicId, currentStoryId);
    } else if (epicName && epicName.trim() !== "" && sourceKey && sourceKey.trim() !== "") {
      relatedStoriesQuery = `
        ${baseSelect}
        WHERE s.dataset_id = ?
        AND LOWER(s.epic_name) = LOWER(?)
        AND LOWER(s.source_key) = LOWER(?)
        AND s.id != ?
      `;
      queryParams.push(datasetId, epicName, sourceKey, currentStoryId);
    } else {
      // No valid criteria to find related stories, return empty array
      return NextResponse.json({ success: true, stories: [] });
    }

    const storiesFromDb = await db.all(relatedStoriesQuery, queryParams);

    const selectedStories: UserStory[] = storiesFromDb.map((story) => ({
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

    return NextResponse.json({ success: true, stories: selectedStories });

  } catch (error) {
    console.error("Error fetching related stories:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch related stories",
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