// File: app/api/admin/datasets/route.ts
import { NextResponse, NextRequest } from "next/server";
import { openDb } from "@/lib/db";

export async function GET(request: NextRequest) {
    // Admin check skipped as per user request for internal tool simplification.
    // console.warn("WARNING: Admin check skipped for /api/admin/datasets endpoint.");

    let db;
    try {
        db = await openDb();
        const datasets = await db.all(`
            SELECT id, name, filename, is_active
            FROM datasets
            ORDER BY name ASC
        `);

        // Ensure DB connection is closed after query
        if (db) {
            await db.close();
        }

        return NextResponse.json(datasets);

    } catch (error: any) {
        console.error("Failed to fetch datasets:", error);
        // Ensure DB is closed even if there's an error after opening it
        if (db) {
            try {
                await db.close();
            } catch (closeError) {
                console.error("Error closing DB after fetch error:", closeError);
            }
        }
        return NextResponse.json({ error: "Failed to fetch datasets", details: error.message }, { status: 500 });
    }
}