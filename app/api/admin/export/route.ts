// File: app/api/admin/export/route.ts
import { NextResponse, NextRequest } from "next/server";
import { openDb } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth"; // Re-including for structure, though check is bypassed

// Define interfaces for the data structure we expect from the DB and the final output
interface DbRow {
    story_id: number;
    story_title: string;
    story_description: string;
    story_acceptance_criteria: string | null; // Assuming JSON string or null
    story_source_key: string | null;
    story_epic_name: string | null;
    review_id: number;
    review_additional_feedback: string | null;
    tester_email: string;
    criterion_id: number;
    criterion_name: string;
    evaluation_rating: number; // 1, 2, 3, 5
}

interface AssessorAnnotation {
    id: string; // tester_email
    criteria: { [criterionName: string]: 'True' | 'Maybe' | 'False' | 'Unknown' };
    feedback: string | null;
}

interface AnnotatedUserStory {
    user_story: string; // story_title
    description: string; // story_description
    acceptance_criteria?: string[]; // Parsed from JSON string
    // Include original INVEST flags if needed, currently omitted for brevity
    annotation: {
        assessors: AssessorAnnotation[];
    };
    // --- Original Metadata ---
    // We need these for grouping but might not include them *inside* the user_story object itself
    // Instead, they define the structure *around* the user_story array.
    // Let's add internal fields for processing, marked with __
    __internal_story_id: number;
    __internal_source_key: string | null;
    __internal_epic_name: string | null;

}

interface EpicOutput {
    epic: string;
    user_stories: AnnotatedUserStory[];
}

interface SourceOutput {
    [epicName: string]: { // Use epic_name as key inside source
        epics: EpicOutput[]; // Technically only one epic per key here, structure matches input
    };
}

interface FinalOutput {
    [sourceKey: string]: SourceOutput; // Actually, the input format is { source_key: { epics: [...] } }
    // Let's adjust to match that structure
}

interface FinalOutputStructure {
    [sourceKey: string]: {
        epics: EpicOutput[];
    };
}


// Helper function to map numeric rating to string
function mapRatingToString(rating: number): 'True' | 'Maybe' | 'False' | 'Unknown' {
    switch (rating) {
        case 5: return 'True';
        case 3: return 'Maybe';
        case 1:
        case 2: return 'False';
        default: return 'Unknown';
    }
}

export async function GET(request: NextRequest) {
    // --- Admin Check ---
    // Placeholder check - replace with real auth later
    const adminCheckResponse = await checkAdminAuth(request);
    if (adminCheckResponse) {
        // In a real scenario, this would return the 403 response.
        // For now, we log a warning if the check *would* have failed.
        // if (adminCheckResponse.status === 403) {
        //     console.warn("Admin check failed, but proceeding due to current bypass.");
        // } else {
        return adminCheckResponse; // Should ideally handle non-403 errors from checkAdminAuth too
        // }
        console.warn("WARNING: Admin check skipped for /api/admin/export endpoint.");
    }
    // --- End Admin Check ---

    const { searchParams } = request.nextUrl;
    const datasetIdParam = searchParams.get('datasetId');

    if (!datasetIdParam) {
        return NextResponse.json({ error: 'Missing datasetId query parameter' }, { status: 400 });
    }

    const datasetId = parseInt(datasetIdParam, 10);
    if (isNaN(datasetId)) {
        return NextResponse.json({ error: 'Invalid datasetId query parameter' }, { status: 400 });
    }

    let db;
    try {
        db = await openDb();

        // Fetch dataset name for filename (optional but good practice)
        const datasetInfo = await db.get('SELECT filename FROM datasets WHERE id = ?', datasetId);
        const datasetFilename = datasetInfo?.filename?.replace('.json', '') || `dataset_${datasetId}`;


        // Query to get all relevant data for reviewed stories in the specified dataset
        // This query fetches a flat list of criterion evaluations, joined with review, story, tester, and criteria info.
        // It only includes stories that have at least one review.
        const rows = await db.all<DbRow[]>(`
            SELECT
                s.id as story_id,
                s.title as story_title,
                s.description as story_description,
                s.acceptance_criteria as story_acceptance_criteria,
                s.source_key as story_source_key,
                s.epic_name as story_epic_name,
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
            -- Ensure only stories with reviews are implicitly included by the JOINs
            ORDER BY
                s.source_key,
                s.epic_name,
                s.id,
                r.id,
                ec.id
        `, datasetId);

        await db.close();

        if (rows.length === 0) {
            return NextResponse.json({ message: 'No reviewed stories found for this dataset.' }, { status: 404 });
        }

        // --- Process the flat data into the nested structure ---
        const processedData: FinalOutputStructure = {};

        for (const row of rows) {
            const sourceKey = row.story_source_key || 'uncategorized_source';
            const epicName = row.story_epic_name || 'uncategorized_epic';
            const storyId = row.story_id;
            const reviewId = row.review_id;
            const testerEmail = row.tester_email;

            // Ensure source key exists
            if (!processedData[sourceKey]) {
                processedData[sourceKey] = { epics: [] };
            }

            // Find or create epic object within the source
            let epicObj = processedData[sourceKey].epics.find(e => e.epic === epicName);
            if (!epicObj) {
                epicObj = { epic: epicName, user_stories: [] };
                processedData[sourceKey].epics.push(epicObj);
            }

            // Find or create story object within the epic
            let storyObj = epicObj.user_stories.find(s => s.__internal_story_id === storyId);
            if (!storyObj) {
                let parsedAC: string[] = [];
                try {
                    if (row.story_acceptance_criteria) {
                        parsedAC = JSON.parse(row.story_acceptance_criteria);
                    }
                } catch (e) {
                    console.warn(`Failed to parse acceptance criteria for story ${storyId}: ${row.story_acceptance_criteria}`);
                }

                storyObj = {
                    user_story: row.story_title, // Use title as user_story field
                    description: row.story_description,
                    acceptance_criteria: parsedAC,
                    annotation: { assessors: [] },
                    // Internal fields for processing
                    __internal_story_id: storyId,
                    __internal_source_key: row.story_source_key,
                    __internal_epic_name: row.story_epic_name,
                };
                epicObj.user_stories.push(storyObj);
            }

            // Find or create assessor object within the story's annotation
            let assessorObj = storyObj.annotation.assessors.find(a => a.id === testerEmail);
            if (!assessorObj) {
                assessorObj = {
                    id: testerEmail,
                    criteria: {},
                    feedback: row.review_additional_feedback, // Get feedback from the first row for this reviewer
                };
                storyObj.annotation.assessors.push(assessorObj);
            }

            // Add the criterion evaluation to the assessor's criteria object
            const ratingString = mapRatingToString(row.evaluation_rating);
            if (row.criterion_name) { // Ensure criterion name is not null/undefined
                assessorObj.criteria[row.criterion_name] = ratingString;
            }
        }

        // --- Prepare Response ---
        const finalJson = JSON.stringify(processedData, null, 2); // Pretty print JSON

        return new NextResponse(finalJson, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="export_${datasetFilename}.json"`, // Use dataset info in filename
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