import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";

const DB_FILE_PATH = path.join(process.cwd(), "data", "reviews.db");

const dbInstance: Database | null = null;

export async function openDb(): Promise<Database> {
  console.log(`Opening SQLite DB connection to: ${DB_FILE_PATH}`);
  const db = await open({
    filename: DB_FILE_PATH,
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON;");

  return db;
}

export async function closeDb(db: Database | null) {
  if (db) {
    console.log("Closing SQLite DB connection.");
    await db.close();
  }
}

export async function getActiveDatasetId(db: Database): Promise<number | null> {
  try {
    const activeDataset = await db.get("SELECT id FROM datasets WHERE is_active = 1 LIMIT 1");
    return activeDataset?.id || null;
  } catch (error) {
    console.error("Error fetching active dataset ID:", error);
    return null;
  }
}
