import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";

const DB_FILE_PATH = path.join(process.cwd(), "data", "reviews.db");

let dbInstance: Database | null = null;

export async function openDb(): Promise<Database> {
    // Return existing instance if already connected (simple singleton pattern)
    // Note: For serverless functions, you might want to connect/close per request
    // But for simpler local dev/single server, this can be okay.
    // if (dbInstance) {
    //   return dbInstance;
    // }

    // Always open a new connection for API routes to ensure statelessness
    console.log(`Opening SQLite DB connection to: ${DB_FILE_PATH}`);
    const db = await open({
        filename: DB_FILE_PATH,
        driver: sqlite3.Database,
    });

    // Enable foreign keys on each connection
    await db.exec("PRAGMA foreign_keys = ON;");

    // dbInstance = db; // Don't store instance for API routes
    return db;
}

// Optional: Function to safely close DB if needed elsewhere
export async function closeDb(db: Database | null) {
    if (db) {
        console.log("Closing SQLite DB connection.");
        await db.close();
    }
}

// Helper to get the currently active dataset ID
export async function getActiveDatasetId(db: Database): Promise<number | null> {
    try {
        const activeDataset = await db.get("SELECT id FROM datasets WHERE is_active = 1 LIMIT 1");
        return activeDataset?.id || null;
    } catch (error) {
        console.error("Error fetching active dataset ID:", error);
        return null;
    }
}