import { NextResponse } from "next/server";
import { openDb } from "@/lib/db";

export async function GET() {
  let db;
  try {
    db = await openDb();

    // Fetch all stories, join with dataset info
    const query = `
        SELECT
            us.id,
            us.title,
            us.description,
            -- us.acceptance_criteria, -- Maybe not needed for admin list view? Fetch if needed
            d.name as datasetName,
            d.filename as datasetFilename,
            d.is_active as datasetIsActive
        FROM user_stories us
        JOIN datasets d ON us.dataset_id = d.id
        ORDER BY d.name, us.id
    `;

    const stories = await db.all(query);

    // Add the string 'id' expected by frontend components if needed
    // (Currently admin monitoring uses numeric id, seems ok)
    // const formattedStories = stories.map(s => ({...s}));

    console.log(`Fetched ${stories.length} total stories from DB for admin.`);
    return NextResponse.json({ success: true, data: stories });

  } catch (error) {
    console.error("Error fetching admin stories from database:", error);
    return NextResponse.json(
        {
          error: "Failed to fetch stories",
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
    );
  } finally {
    if (db) {
      await db.close();
    }
  }
}