import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import path from "path";
import { open } from "sqlite";

const DB_FILE_PATH = path.join(process.cwd(), "data", "reviews.db");

async function openDb() {
  return open({
    filename: DB_FILE_PATH,
    driver: sqlite3.Database,
  });
}

export async function GET() {
  let db;
  try {
    console.log("Testing SQLite database connection...");
    console.log("DB Path:", DB_FILE_PATH);

    db = await openDb();

    const tablesResult = await db.all(`
        SELECT name
        FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%';
      `);
    const tables = tablesResult.map((row) => row.name);
    console.log("Available tables:", tables);

    let storiesCount = 0;
    let criteriaCount = 0;
    let datasetsCount = 0;
    let reviewsCount = 0;

    try {
      storiesCount = (await db.get("SELECT COUNT(*) as count FROM user_stories"))?.count ?? 0;
      criteriaCount =
        (await db.get("SELECT COUNT(*) as count FROM evaluation_criteria"))?.count ?? 0;
      datasetsCount = (await db.get("SELECT COUNT(*) as count FROM datasets"))?.count ?? 0;
      reviewsCount = (await db.get("SELECT COUNT(*) as count FROM reviews"))?.count ?? 0;
    } catch (countError) {
      console.warn("Could not get counts, tables might not exist yet:", countError);
    }

    console.log("Datasets count:", datasetsCount);
    console.log("User stories count:", storiesCount);
    console.log("Evaluation criteria count:", criteriaCount);
    console.log("Reviews count:", reviewsCount);

    return NextResponse.json({
      success: true,
      message: "SQLite database connection successful",
      dbPath: DB_FILE_PATH,
      tables,
      datasetsCount,
      storiesCount,
      criteriaCount,
      reviewsCount,
    });
  } catch (error) {
    console.error("Error testing SQLite database connection:", error);
    return NextResponse.json(
      {
        error: "Failed to connect to SQLite database",
        dbPath: DB_FILE_PATH,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    if (db) {
      await db.close();
      console.log("SQLite test connection closed.");
    }
  }
}
