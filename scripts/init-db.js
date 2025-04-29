const sqlite3 = require("sqlite3").verbose(); // Use verbose for better debugging
const fs = require("fs").promises;
const path = require("path");

const DB_FILE_PATH = path.join(__dirname, "..", "data", "reviews.db");
const SCHEMA_FILE_PATH = path.join(__dirname, "..", "db", "schema.sql");
const DATA_DIR_PATH = path.join(__dirname, "..", "data");

// INVEST criteria to pre-populate
const investCriteria = [
  { name: "Independent", description: "The story is self-contained and not dependent on other stories." },
  { name: "Negotiable", description: "Details can be discussed and refined between stakeholders." },
  { name: "Valuable", description: "The story delivers value to stakeholders." },
  { name: "Estimable", description: "The size of the story can be estimated with reasonable accuracy." },
  { name: "Small", description: "The story is small enough to be completed in one sprint." },
  { name: "Testable", description: "The story can be tested to verify it meets requirements." },
];

// Helper function to run DB queries with Promises
function runQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) { // Use function() to access 'this'
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

  // Ensure data directory exists
  try {
    await fs.mkdir(path.dirname(DB_FILE_PATH), { recursive: true });
  } catch (err) {
    console.error("Error creating data directory:", err);
    throw err;
  }

  // Connect to (or create) the database file
  const db = new sqlite3.Database(DB_FILE_PATH, (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
      throw err;
    }
    console.log("Connected to the SQLite database.");
  });

  try {
    // Enable foreign keys
    await runQuery(db, "PRAGMA foreign_keys = ON;");
    console.log("Foreign key support enabled.");

    // Read and execute the schema
    console.log(`Reading schema file from: ${SCHEMA_FILE_PATH}`);
    const schemaSql = await fs.readFile(SCHEMA_FILE_PATH, "utf8");
    console.log("Executing database schema...");
    // SQLite doesn't have DROP TABLE IF EXISTS easily in exec, so we execute line by line
    // and ignore "no such table" errors during drop for idempotency
    const schemaStatements = schemaSql.split(';');
    for (const statement of schemaStatements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement) {
        // A simple way to make drops idempotent - might need refinement for complex schemas
        if (trimmedStatement.toUpperCase().startsWith('DROP TABLE')) {
          try {
            await runQuery(db, trimmedStatement);
          } catch (dropError) {
            if (!dropError.message.includes('no such table')) {
              console.error(`Error dropping table (ignored if 'no such table'): ${dropError.message}`);
              // throw dropError; // Optionally re-throw if it's not 'no such table'
            }
          }
        } else {
          await runQuery(db, trimmedStatement); // Use run for CREATE etc.
        }
      }
    }

    console.log("Database schema applied successfully.");

    // --- Populate evaluation_criteria ---
    console.log("Populating evaluation_criteria table...");
    let criteriaCount = 0;
    const insertCriterionStmt = db.prepare("INSERT INTO evaluation_criteria (name, description) VALUES (?, ?)");
    for (const criterion of investCriteria) {
      await new Promise((resolve, reject) => {
        insertCriterionStmt.run(criterion.name, criterion.description, function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
      criteriaCount++;
    }
    insertCriterionStmt.finalize(); // Close the prepared statement
    console.log(`Inserted ${criteriaCount} evaluation criteria.`);

    // --- Scan /data directory and populate datasets and user_stories ---
    console.log(`Scanning ${DATA_DIR_PATH} for dataset JSON files...`);
    const files = await fs.readdir(DATA_DIR_PATH);
    const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json' && file !== 'reviews.db'); // Exclude db file

    let totalStoriesInserted = 0;
    let datasetsInserted = 0;
    let firstDatasetId = null;

    if (jsonFiles.length === 0) {
      console.warn("No JSON dataset files found in /data directory.");
    }

    for (const filename of jsonFiles) {
      console.log(`Processing dataset file: ${filename}`);
      const datasetName = path.basename(filename, '.json'); // Use filename without extension as name
      const jsonPath = path.join(DATA_DIR_PATH, filename);

      try {
        // Insert dataset record
        const datasetResult = await runQuery(db, "INSERT INTO datasets (filename, name) VALUES (?, ?)", [filename, datasetName]);
        const datasetId = datasetResult.lastID;
        datasetsInserted++;
        if (!firstDatasetId) firstDatasetId = datasetId; // Track the first dataset inserted
        console.log(`Inserted dataset '${datasetName}' with ID: ${datasetId}`);

        // Read and parse JSON data
        const jsonData = await fs.readFile(jsonPath, "utf-8");
        const data = JSON.parse(jsonData);

        let storiesInDataset = 0;
        const insertStoryStmt = db.prepare(`INSERT INTO user_stories
            (dataset_id, title, description, acceptance_criteria, independent, negotiable, valuable, estimable, small, testable)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

        // Assuming structure { "sourceKey": { "epics": [...] } }
        for (const sourceKey of Object.keys(data)) {
          const source = data[sourceKey];
          if (source.epics && Array.isArray(source.epics)) {
            for (const epic of source.epics) {
              if (epic.user_stories && Array.isArray(epic.user_stories)) {
                for (const story of epic.user_stories) {
                  const title = story.user_story.substring(0, 100) + (story.user_story.length > 100 ? "..." : "");
                  const description = story.user_story;
                  const acceptance_criteria = story.acceptance_criteria ? JSON.stringify(story.acceptance_criteria) : '[]'; // Store as JSON string
                  const independent = story.independent === undefined ? null : story.independent;
                  const negotiable = story.negotiable === undefined ? null : story.negotiable;
                  const valuable = story.valuable === undefined ? null : story.valuable;
                  const estimable = story.estimable === undefined ? null : story.estimable;
                  const small = story.small === undefined ? null : story.small;
                  const testable = story.testable === undefined ? null : story.testable;

                  await new Promise((resolve, reject) => {
                    insertStoryStmt.run(
                        datasetId, title, description, acceptance_criteria,
                        independent, negotiable, valuable, estimable, small, testable,
                        function(err) {
                          if (err) reject(err);
                          else resolve();
                        }
                    );
                  });
                  storiesInDataset++;
                }
              }
            }
          }
        }
        insertStoryStmt.finalize(); // Close statement for this dataset
        console.log(`Inserted ${storiesInDataset} stories for dataset '${datasetName}'.`);
        totalStoriesInserted += storiesInDataset;

      } catch (err) {
        console.error(`Error processing file ${filename}:`, err);
        // Decide if you want to stop or continue with other files
      }
    }

    // Set the first dataset found as active (can be changed later via UI/API)
    if (firstDatasetId) {
      await runQuery(db, "UPDATE datasets SET is_active = 1 WHERE id = ?", [firstDatasetId]);
      console.log(`Marked dataset ID ${firstDatasetId} as active.`);
    } else {
      console.warn("No datasets were inserted, cannot mark one as active.");
    }

    console.log(`Finished processing datasets. Inserted ${datasetsInserted} datasets and ${totalStoriesInserted} total user stories.`);

    // Verify final counts
    const storyCountResult = await getQuery(db, "SELECT COUNT(*) as count FROM user_stories");
    const datasetCountResult = await getQuery(db, "SELECT COUNT(*) as count FROM datasets");
    const criteriaCountResult = await getQuery(db, "SELECT COUNT(*) as count FROM evaluation_criteria");
    console.log(`Final Verification - Datasets: ${datasetCountResult?.count}, Stories: ${storyCountResult?.count}, Criteria: ${criteriaCountResult?.count}`);

  } catch (err) {
    console.error("Error during database initialization:", err);
    throw err; // Re-throw to signal failure
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed.");
      }
    });
  }
}

// Run the initialization
initializeDatabase()
    .then(() => {
      console.log("Database initialization and population script finished successfully.");
      process.exit(0); // Success
    })
    .catch((err) => {
      console.error("Initialization script failed overall:", err);
      process.exit(1); // Failure
    });