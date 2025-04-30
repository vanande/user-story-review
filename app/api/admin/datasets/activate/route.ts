// File: app/api/admin/datasets/activate/route.ts
import { NextResponse, NextRequest } from "next/server";
import { openDb } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth"; // Re-including for structure

export async function POST(request: NextRequest) {
    // --- Admin Check ---
    // Placeholder check - replace with real auth later
    const adminCheckResponse = await checkAdminAuth(request);
    if (adminCheckResponse) {
        // In a real scenario, this would return the 403 response.
        console.warn("WARNING: Admin check skipped for /api/admin/datasets/activate endpoint.");
    }
    // --- End Admin Check ---

    let db;
    try {
        const body = await request.json();
        const { datasetId } = body;

        if (!datasetId || typeof datasetId !== 'number' || !Number.isInteger(datasetId)) {
            return NextResponse.json({ error: 'Invalid or missing datasetId in request body. It must be an integer.' }, { status: 400 });
        }

        db = await openDb();

        // Use a transaction to ensure atomicity
        await db.exec('BEGIN TRANSACTION;');

        // Deactivate any currently active dataset
        const deactivateResult = await db.run('UPDATE datasets SET is_active = 0 WHERE is_active = 1;');
        console.log(`Deactivated ${deactivateResult.changes} dataset(s).`);

        // Activate the selected dataset
        const activateResult = await db.run('UPDATE datasets SET is_active = 1 WHERE id = ?;', datasetId);

        if (activateResult.changes === 0) {
            // Rollback if the dataset to activate wasn't found
            await db.exec('ROLLBACK;');
            await db.close();
            return NextResponse.json({ error: `Dataset with ID ${datasetId} not found.` }, { status: 404 });
        }

        console.log(`Activated dataset ID ${datasetId}.`);

        // Commit the transaction
        await db.exec('COMMIT;');

        await db.close();

        return NextResponse.json({ message: `Dataset ID ${datasetId} successfully activated.` });

    } catch (error: any) {
        console.error("Failed to activate dataset:", error);
        // Rollback transaction if an error occurred after starting it
        if (db) {
            try {
                await db.exec('ROLLBACK;');
            } catch (rollbackError) {
                console.error("Error rolling back transaction:", rollbackError);
            }
            try {
                await db.close();
            } catch (closeError) {
                console.error("Error closing DB after activation error:", closeError);
            }
        }
        return NextResponse.json({ error: "Failed to activate dataset", details: error.message }, { status: 500 });
    }
}