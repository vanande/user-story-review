import { NextResponse } from "next/server";
import { openDb } from "@/lib/db"; // Import DB helper

export async function GET() {
  let db;
  try {
    db = await openDb();

    // Fetch principles from the database table
    const principles = await db.all(
        `SELECT id, name as label, description
         FROM evaluation_criteria
         ORDER BY id` // Order consistently
    );

    // Add the 'id' string field expected by the frontend (mapping name to id)
    // This assumes the names are like 'Independent', 'Negotiable', etc.
    const formattedPrinciples = principles.map(p => ({
      ...p,
      id: p.label.toLowerCase() // Use lowercase name as the string ID
    }));


    console.log(`Fetched ${formattedPrinciples.length} principles from DB.`);

    return NextResponse.json({ success: true, data: formattedPrinciples });

  } catch (error) {
    console.error("Error fetching principles from database:", error);
    return NextResponse.json(
        {
          error: "Failed to fetch principles",
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