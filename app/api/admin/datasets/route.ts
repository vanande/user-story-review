import { NextResponse, NextRequest } from "next/server";
import { openDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  let db;
  try {
    db = await openDb();
    const datasets = await db.all(`
            SELECT id, name, filename, is_active
            FROM datasets
            ORDER BY name ASC
        `);

    if (db) {
      await db.close();
    }

    return NextResponse.json(datasets);
  } catch (error: any) {
    console.error("Failed to fetch datasets:", error);

    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error("Error closing DB after fetch error:", closeError);
      }
    }
    return NextResponse.json(
      { error: "Failed to fetch datasets", details: error.message },
      { status: 500 }
    );
  }
}
