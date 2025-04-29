-- Table to store information about the datasets (JSON files)
CREATE TABLE IF NOT EXISTS datasets (
                                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                                        filename TEXT NOT NULL UNIQUE,
                                        name TEXT NOT NULL, -- e.g., derived from filename or a future field
                                        is_active BOOLEAN NOT NULL DEFAULT 0,
                                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store user stories, linked to a dataset
CREATE TABLE IF NOT EXISTS user_stories (
                                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                                            dataset_id INTEGER NOT NULL,
                                            source_key TEXT, -- Added: e.g., 'llm', 'rag+CoT'
                                            epic_name TEXT,  -- Added: e.g., 'Loan Application Submission'
                                            title TEXT NOT NULL,
                                            description TEXT NOT NULL,
                                            acceptance_criteria TEXT, -- Store as JSON string
                                            independent BOOLEAN,
                                            negotiable BOOLEAN,
                                            valuable BOOLEAN,
                                            estimable BOOLEAN,
                                            small BOOLEAN,
                                            testable BOOLEAN,
                                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            FOREIGN KEY (dataset_id) REFERENCES datasets(id)
    );

-- Table for testers (identified by email)
CREATE TABLE IF NOT EXISTS testers (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       email TEXT NOT NULL UNIQUE,
                                       name TEXT, -- Optional, can be derived from email
                                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for evaluation criteria (INVEST principles)
CREATE TABLE IF NOT EXISTS evaluation_criteria (
                                                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                   name TEXT NOT NULL UNIQUE, -- e.g., 'Independent', 'Negotiable'
                                                   description TEXT
);

-- Table for storing reviews submitted by testers
CREATE TABLE IF NOT EXISTS reviews (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       story_id INTEGER NOT NULL,
                                       tester_id INTEGER NOT NULL,
                                       additional_feedback TEXT,
                                       submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                       FOREIGN KEY (story_id) REFERENCES user_stories(id),
    FOREIGN KEY (tester_id) REFERENCES testers(id)
    );

-- Table storing the rating for each criterion within a review
CREATE TABLE IF NOT EXISTS criterion_evaluations (
                                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                     review_id INTEGER NOT NULL,
                                                     criterion_id INTEGER NOT NULL,
                                                     rating INTEGER NOT NULL, -- 1 (No), 3 (Partial), 5 (Yes)
                                                     FOREIGN KEY (review_id) REFERENCES reviews(id),
    FOREIGN KEY (criterion_id) REFERENCES evaluation_criteria(id),
    UNIQUE(review_id, criterion_id) -- Ensure one evaluation per criterion per review
    );

-- Table for active review sessions (using monitoring-schema concepts)
-- Note: This table is less relevant now we track recent submissions via 'reviews' table.
-- Keep it for now if needed for other potential features, or remove if truly unused.
CREATE TABLE IF NOT EXISTS active_review_sessions (
                                                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                      tester_id INTEGER NOT NULL REFERENCES testers(id),
    story_id INTEGER NOT NULL REFERENCES user_stories(id),
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER NOT NULL DEFAULT 0,
    completed_principles TEXT DEFAULT '[]', -- Store as JSON array string
    UNIQUE (tester_id, story_id)
    );

-- Indexes for performance
DROP INDEX IF EXISTS idx_reviews_story_id;
DROP INDEX IF EXISTS idx_reviews_tester_id;
DROP INDEX IF EXISTS idx_criterion_evaluations_review_id;
DROP INDEX IF EXISTS idx_criterion_evaluations_criterion_id;
DROP INDEX IF EXISTS idx_user_stories_dataset_id;
DROP INDEX IF EXISTS idx_active_sessions_tester_story;
DROP INDEX IF EXISTS idx_user_stories_source_epic; -- Added index

CREATE INDEX idx_reviews_story_id ON reviews(story_id);
CREATE INDEX idx_reviews_tester_id ON reviews(tester_id);
CREATE INDEX idx_criterion_evaluations_review_id ON criterion_evaluations(review_id);
CREATE INDEX idx_criterion_evaluations_criterion_id ON criterion_evaluations(criterion_id);
CREATE INDEX idx_user_stories_dataset_id ON user_stories(dataset_id);
CREATE INDEX idx_active_sessions_tester_story ON active_review_sessions(tester_id, story_id);
CREATE INDEX idx_user_stories_source_epic ON user_stories(source_key, epic_name); -- Added index