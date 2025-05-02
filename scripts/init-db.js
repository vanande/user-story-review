const sqlite3 = require("sqlite3").verbose();
const fs = require("fs").promises;
const path = require("path");

const DB_FILE_PATH = path.join(__dirname, "..", "data", "reviews.db");
const SCHEMA_FILE_PATH = path.join(__dirname, "..", "db", "schema.sql");
const DATA_DIR_PATH = path.join(__dirname, "..", "data");

const investCriteria = [
  {
    name: "Independent",
    description: "The story is self-contained and not dependent on other stories.",
  },
  { name: "Negotiable", description: "Details can be discussed and refined between stakeholders." },
  { name: "Valuable", description: "The story delivers value to stakeholders." },
  {
    name: "Estimable",
    description: "The size of the story can be estimated with reasonable accuracy.",
  },
  { name: "Small", description: "The story is small enough to be completed in one sprint." },
  { name: "Testable", description: "The story can be tested to verify it meets requirements." },
];

function runQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error("DB Run Error:", err.message, "SQL:", sql.substring(0, 100) + "...");
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

function execQuery(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, function (err) {
      if (err) {
        console.error("DB Exec Error:", err.message, "SQL:", sql.substring(0, 100) + "...");
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function getQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error("DB Get Error:", err.message, "SQL:", sql.substring(0, 100) + "...");
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function allQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error("DB All Error:", err.message, "SQL:", sql.substring(0, 100) + "...");
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function initializeDatabase() {
  console.log(`Initializing database at: ${DB_FILE_PATH}`);

  try {
    await fs.mkdir(path.dirname(DB_FILE_PATH), { recursive: true });
  } catch (err) {
    console.error("Error creating data directory:", err);
    throw err;
  }

  let db;
  try {
    db = new sqlite3.Database(DB_FILE_PATH, (err) => {
      if (err) {
        console.error("Error opening database connection:", err.message);
      } else {
        console.log("Connected to the SQLite database.");
      }
    });
  } catch (constructorError) {
    console.error("Synchronous error creating DB object:", constructorError);
    throw constructorError;
  }

  try {
    await runQuery(db, "PRAGMA foreign_keys = ON;");
    console.log("Foreign key support enabled.");

    console.log(`Reading schema file from: ${SCHEMA_FILE_PATH}`);
    const schemaSql = await fs.readFile(SCHEMA_FILE_PATH, "utf8");
    console.log("Executing database schema (applying CREATE TABLE IF NOT EXISTS)...");
    await execQuery(db, schemaSql);
    console.log("Database schema applied successfully.");

    console.log("Clearing existing data (users, reviews, stories, datasets)...");
    await runQuery(db, "DELETE FROM criterion_evaluations;");
    await runQuery(db, "DELETE FROM reviews;");
    await runQuery(db, "DELETE FROM testers;");
    await runQuery(db, "DELETE FROM user_stories;");
    await runQuery(db, "DELETE FROM datasets;");
    await runQuery(db, "DELETE FROM evaluation_criteria;");
    await runQuery(db, "DELETE FROM active_review_sessions;");
    try {
      await runQuery(
        db,
        "DELETE FROM sqlite_sequence WHERE name IN ('datasets', 'user_stories', 'testers', 'reviews', 'criterion_evaluations', 'evaluation_criteria', 'active_review_sessions');"
      );
    } catch (seqErr) {
      if (!seqErr.message.includes("no such table")) {
        console.warn("Could not reset sequence counters:", seqErr.message);
      }
    }
    console.log("Existing data cleared.");

    console.log("Populating evaluation_criteria table...");
    let criteriaCount = 0;
    const insertCriterionStmt = db.prepare(
      "INSERT INTO evaluation_criteria (name, description) VALUES (?, ?)"
    );
    for (const criterion of investCriteria) {
      await new Promise((resolve, reject) => {
        insertCriterionStmt.run(criterion.name, criterion.description, function (err) {
          if (err) reject(err);
          else resolve();
        });
      });
      criteriaCount++;
    }
    await new Promise((resolve, reject) =>
      insertCriterionStmt.finalize((err) => (err ? reject(err) : resolve()))
    );
    console.log(`Inserted ${criteriaCount} evaluation criteria.`);

    console.log(`Scanning ${DATA_DIR_PATH} for dataset JSON files...`);
    const files = await fs.readdir(DATA_DIR_PATH);
    const jsonFiles = files.filter((file) => path.extname(file).toLowerCase() === ".json");

    let totalStoriesInserted = 0;
    let datasetsInserted = 0;
    let firstDatasetId = null;

    if (jsonFiles.length === 0) {
      console.warn("No JSON dataset files found in /data directory.");
    }

    for (const filename of jsonFiles) {
      if (filename === path.basename(DB_FILE_PATH)) continue;

      console.log(`Processing dataset file: ${filename}`);
      const datasetName = path.basename(filename, ".json");
      const jsonPath = path.join(DATA_DIR_PATH, filename);

      try {
        const datasetResult = await runQuery(
          db,
          "INSERT INTO datasets (filename, name) VALUES (?, ?)",
          [filename, datasetName]
        );
        const datasetId = datasetResult.lastID;
        datasetsInserted++;
        if (!firstDatasetId) firstDatasetId = datasetId;
        console.log(`Inserted dataset '${datasetName}' with ID: ${datasetId}`);

        const jsonData = await fs.readFile(jsonPath, "utf-8");
        const data = JSON.parse(jsonData);

        let storiesInDataset = 0;
        const insertStoryStmt = db.prepare(`INSERT INTO user_stories
            (dataset_id, source_key, epic_name, title, description, acceptance_criteria, independent, negotiable, valuable, estimable, small, testable)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

        for (const sourceKey of Object.keys(data)) {
          const source = data[sourceKey];
          if (source.epics && Array.isArray(source.epics)) {
            for (const epic of source.epics) {
              const epicName = epic.epic || "Unknown Epic";
              if (epic.user_stories && Array.isArray(epic.user_stories)) {
                for (const story of epic.user_stories) {
                  const title =
                    story.user_story.substring(0, 150) +
                    (story.user_story.length > 150 ? "..." : "");
                  const description = story.user_story;
                  const acceptance_criteria = story.acceptance_criteria
                    ? JSON.stringify(story.acceptance_criteria)
                    : "[]";
                  const independent =
                    story.independent === undefined ? null : story.independent ? 1 : 0;
                  const negotiable =
                    story.negotiable === undefined ? null : story.negotiable ? 1 : 0;
                  const valuable = story.valuable === undefined ? null : story.valuable ? 1 : 0;
                  const estimable = story.estimable === undefined ? null : story.estimable ? 1 : 0;
                  const small = story.small === undefined ? null : story.small ? 1 : 0;
                  const testable = story.testable === undefined ? null : story.testable ? 1 : 0;

                  await new Promise((resolve, reject) => {
                    insertStoryStmt.run(
                      datasetId,
                      sourceKey,
                      epicName,
                      title,
                      description,
                      acceptance_criteria,
                      independent,
                      negotiable,
                      valuable,
                      estimable,
                      small,
                      testable,
                      function (err) {
                        if (err) {
                          console.error(
                            `Error inserting story: ${title.substring(0, 30)}...`,
                            err.message
                          );
                          reject(err);
                        } else resolve();
                      }
                    );
                  });
                  storiesInDataset++;
                }
              }
            }
          }
        }
        await new Promise((resolve, reject) =>
          insertStoryStmt.finalize((err) => (err ? reject(err) : resolve()))
        );
        console.log(`Inserted ${storiesInDataset} stories for dataset '${datasetName}'.`);
        totalStoriesInserted += storiesInDataset;
      } catch (err) {
        console.error(`Error processing file ${filename}:`, err);
      }
    }

    if (firstDatasetId) {
      await runQuery(db, "UPDATE datasets SET is_active = 1 WHERE id = ?", [firstDatasetId]);
      console.log(`Marked dataset ID ${firstDatasetId} as active.`);
    } else {
      console.warn("No datasets were inserted, cannot mark one as active.");
    }

    console.log(
      `Finished processing datasets. Inserted ${datasetsInserted} datasets and ${totalStoriesInserted} total user stories.`
    );

    const storyCountResult = await getQuery(db, "SELECT COUNT(*) as count FROM user_stories");
    const datasetCountResult = await getQuery(db, "SELECT COUNT(*) as count FROM datasets");
    const criteriaCountResult = await getQuery(
      db,
      "SELECT COUNT(*) as count FROM evaluation_criteria"
    );
    console.log(
      `Final Verification - Datasets: ${datasetCountResult?.count}, Stories: ${storyCountResult?.count}, Criteria: ${criteriaCountResult?.count}`
    );
  } catch (err) {
    console.error("Error during database initialization steps:", err);

    if (db) {
      await new Promise((resolve, reject) => {
        db.close((err) => (err ? reject(err) : resolve()));
      }).catch((closeErr) => console.error("Error closing DB after script error:", closeErr));
    }
    throw err;
  } finally {
    if (db) {
      await new Promise((resolve, reject) => {
        console.log("Attempting to close database connection in finally block...");
        db.close((err) => {
          if (err) {
            console.error("Error closing database in finally block:", err.message);

            resolve();
          } else {
            console.log("Database connection closed successfully in finally block.");
            resolve();
          }
        });
      }).catch((closeErr) =>
        console.error("Caught error during final DB close attempt:", closeErr)
      );
    }
  }
}

initializeDatabase()
  .then(() => {
    console.log("Database initialization and population script finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Initialization script failed overall:", err);
    process.exit(1);
  });
