import { NextResponse, NextRequest } from "next/server";
import { openDb } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

interface DbRow {
  story_id: number;
  story_title: string;
  story_description: string;
  story_acceptance_criteria: string | null;
  story_source_key: string | null;
  story_epic_name: string | null;
  story_epic_id: string | null;
  original_story_id: string | null;
  review_id: number;
  review_additional_feedback: string | null;
  tester_email: string;
  criterion_id: number;
  criterion_name: string;
  evaluation_rating: number;
}

interface AssessorAnnotation {
  id: string;
  criteria: { [criterionName: string]: "True" | "Maybe" | "False" | "Unknown" };
  feedback: string | null;
}

interface AnnotatedUserStory {
  user_story: string;
  description: string;
  acceptance_criteria?: string[];
  id: string;

  annotation: {
    assessors: AssessorAnnotation[];
  };

  __internal_story_id: number;
  __internal_source_key: string | null;
  __internal_epic_name: string | null;
}

interface EpicOutput {
  epic: string;
  id: string;
  user_stories: AnnotatedUserStory[];
}

interface SourceOutput {
  [epicName: string]: {
    epics: EpicOutput[];
  };
}

interface FinalOutputStructure {
  [sourceKey: string]: {
    epics: EpicOutput[];
  };
}

function mapRatingToString(rating: number): "True" | "Maybe" | "False" | "Unknown" {
  switch (rating) {
    case 5:
      return "True";
    case 3:
      return "Maybe";
    case 1:
    case 2:
      return "False";
    default:
      return "Unknown";
  }
}

export async function GET(request: NextRequest) {
  const adminCheckResponse = await checkAdminAuth(request);
  if (adminCheckResponse) {
    return adminCheckResponse;
  }

  const { searchParams } = request.nextUrl;
  const datasetIdParam = searchParams.get("datasetId");

  if (!datasetIdParam) {
    return NextResponse.json({ error: "Missing datasetId query parameter" }, { status: 400 });
  }

  const datasetId = parseInt(datasetIdParam, 10);
  if (isNaN(datasetId)) {
    return NextResponse.json({ error: "Invalid datasetId query parameter" }, { status: 400 });
  }

  let db;
  try {
    db = await openDb();

    const datasetInfo = await db.get("SELECT filename FROM datasets WHERE id = ?", datasetId);
    const datasetFilename = datasetInfo?.filename?.replace(".json", "") || `dataset_${datasetId}`;

    const rows = await db.all<DbRow[]>(
      `
            SELECT
                s.id as story_id,
                s.title as story_title,
                s.description as story_description,
                s.acceptance_criteria as story_acceptance_criteria,
                s.source_key as story_source_key,
                s.epic_name as story_epic_name,
                s.epic_id as story_epic_id,
                s.story_id as original_story_id,
                r.id as review_id,
                r.additional_feedback as review_additional_feedback,
                t.email as tester_email,
                ec.id as criterion_id,
                ec.name as criterion_name,
                ce.rating as evaluation_rating
            FROM user_stories s
            JOIN reviews r ON s.id = r.story_id
            JOIN testers t ON r.tester_id = t.id
            JOIN criterion_evaluations ce ON r.id = ce.review_id
            JOIN evaluation_criteria ec ON ce.criterion_id = ec.id
            WHERE s.dataset_id = ?
            ORDER BY
                s.source_key,
                s.epic_name,
                s.id,
                r.id,
                ec.id
        `,
      datasetId
    );

    await db.close();

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No reviewed stories found for this dataset." },
        { status: 404 }
      );
    }

    const processedData: FinalOutputStructure = {};

    for (const row of rows) {
      const sourceKey = row.story_source_key || "uncategorized_source";
      const epicName = row.story_epic_name || "uncategorized_epic";
      const storyId = row.story_id;
      const reviewId = row.review_id;
      const testerEmail = row.tester_email;

      if (!processedData[sourceKey]) {
        processedData[sourceKey] = { epics: [] };
      }

      let epicObj = processedData[sourceKey].epics.find((e) => e.epic === epicName);
      if (!epicObj) {
        epicObj = { 
          epic: epicName, 
          id: row.story_epic_id || epicName,
          user_stories: [] 
        };
        processedData[sourceKey].epics.push(epicObj);
      }

      let storyObj = epicObj.user_stories.find((s) => s.__internal_story_id === storyId);
      if (!storyObj) {
        let parsedAC: string[] = [];
        try {
          if (row.story_acceptance_criteria) {
            parsedAC = JSON.parse(row.story_acceptance_criteria);
          }
        } catch (e) {
          console.warn(
            `Failed to parse acceptance criteria for story ${storyId}: ${row.story_acceptance_criteria}`
          );
        }

        storyObj = {
          user_story: row.story_title,
          description: row.story_description,
          acceptance_criteria: parsedAC,
          id: row.original_story_id || `${row.story_id}`,
          annotation: { assessors: [] },

          __internal_story_id: storyId,
          __internal_source_key: row.story_source_key,
          __internal_epic_name: row.story_epic_name,
        };
        epicObj.user_stories.push(storyObj);
      }

      let assessorObj = storyObj.annotation.assessors.find((a) => a.id === testerEmail);
      if (!assessorObj) {
        assessorObj = {
          id: testerEmail,
          criteria: {},
          feedback: row.review_additional_feedback,
        };
        storyObj.annotation.assessors.push(assessorObj);
      }

      const ratingString = mapRatingToString(row.evaluation_rating);
      if (row.criterion_name) {
        assessorObj.criteria[row.criterion_name] = ratingString;
      }
    }

    const finalJson = JSON.stringify(processedData, null, 2);

    return new NextResponse(finalJson, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="export_${datasetFilename}.json"`,
      },
    });
  } catch (error: any) {
    console.error("Export failed:", error);
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error("Error closing DB after export error:", closeError);
      }
    }
    return NextResponse.json({ error: "Export failed", details: error.message }, { status: 500 });
  }
}
