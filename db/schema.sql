-- Table to store information about the datasets (JSON files)
CREATE TABLE datasets (
                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                          filename TEXT NOT NULL UNIQUE,
                          name TEXT NOT NULL, -- e.g., derived from filename or a future field
                          is_active BOOLEAN NOT NULL DEFAULT 0,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store user stories, linked to a dataset
CREATE TABLE user_stories (
                              id INTEGER PRIMARY KEY AUTOINCREMENT,
                              dataset_id INTEGER NOT NULL,
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
CREATE TABLE testers (
                         id INTEGER PRIMARY KEY AUTOINCREMENT,
                         email TEXT NOT NULL UNIQUE,
                         name TEXT, -- Optional, can be derived from email
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for evaluation criteria (INVEST principles)
CREATE TABLE evaluation_criteria (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     name TEXT NOT NULL UNIQUE, -- e.g., 'Independent', 'Negotiable'
                                     description TEXT
);

-- Table for storing reviews submitted by testers
CREATE TABLE reviews (
                         id INTEGER PRIMARY KEY AUTOINCREMENT,
                         story_id INTEGER NOT NULL,
                         tester_id INTEGER NOT NULL,
                         additional_feedback TEXT,
                         submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         FOREIGN KEY (story_id) REFERENCES user_stories(id),
                         FOREIGN KEY (tester_id) REFERENCES testers(id)
);

-- Table storing the rating for each criterion within a review
CREATE TABLE criterion_evaluations (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       review_id INTEGER NOT NULL,
                                       criterion_id INTEGER NOT NULL,
                                       rating INTEGER NOT NULL, -- 1 (No), 3 (Partial), 5 (Yes)
                                       FOREIGN KEY (review_id) REFERENCES reviews(id),
                                       FOREIGN KEY (criterion_id) REFERENCES evaluation_criteria(id),
                                       UNIQUE(review_id, criterion_id) -- Ensure one evaluation per criterion per review
);

-- Table for active review sessions (using monitoring-schema concepts)
CREATE TABLE active_review_sessions (
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
CREATE INDEX idx_reviews_story_id ON reviews(story_id);
CREATE INDEX idx_reviews_tester_id ON reviews(tester_id);
CREATE INDEX idx_criterion_evaluations_review_id ON criterion_evaluations(review_id);
CREATE INDEX idx_criterion_evaluations_criterion_id ON criterion_evaluations(criterion_id);
CREATE INDEX idx_user_stories_dataset_id ON user_stories(dataset_id);
CREATE INDEX idx_active_sessions_tester_story ON active_review_sessions(tester_id, story_id);