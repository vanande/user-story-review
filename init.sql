-- Drop tables if they exist
DROP TABLE IF EXISTS criterion_evaluations;
DROP TABLE IF EXISTS evaluation_criteria;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS user_stories;
DROP TABLE IF EXISTS testers;

-- Create Testers table
CREATE TABLE testers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create User Stories table
CREATE TABLE user_stories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL, -- Assuming title is required
    description TEXT NOT NULL,
    acceptance_criteria TEXT[], -- Store acceptance criteria as an array of text
    -- Add columns for INVEST properties if you want to store them
    independent BOOLEAN,
    negotiable BOOLEAN,
    valuable BOOLEAN,
    estimable BOOLEAN,
    small BOOLEAN,
    testable BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES user_stories(id) ON DELETE CASCADE,
    tester_id INTEGER NOT NULL REFERENCES testers(id) ON DELETE CASCADE,
    additional_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Evaluation Criteria table (INVEST Principles)
CREATE TABLE evaluation_criteria (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL, -- e.g., 'Independent', 'Negotiable'
    description TEXT,
    question TEXT -- Store the question for the frontend
);

-- Create Criterion Evaluations table (Join table for reviews and criteria)
CREATE TABLE criterion_evaluations (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    criterion_id INTEGER NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL, -- Store rating as integer (e.g., 1, 3, 5)
    UNIQUE(review_id, criterion_id) -- Ensure one evaluation per criterion per review
);

-- Insert default evaluation criteria (INVEST)
INSERT INTO evaluation_criteria (name, description, question)
VALUES
    ('Independent', 'The story should be self-contained, without inherent dependencies on other stories.', 'Can this story be developed, tested, and delivered on its own?'),
    ('Negotiable', 'Stories are not contracts; leave space for discussion about details.', 'Is the scope flexible enough to allow for negotiation?'),
    ('Valuable', 'It must deliver value to the end-user or customer.', 'Is the benefit to the user clear and significant?'),
    ('Estimable', 'You must be able to estimate the size/effort required to implement the story.', 'Can the team reasonably estimate the effort for this story?'),
    ('Small', 'Stories should be small enough to be completed within an iteration.', 'Is the story small enough to be completed in one sprint/iteration?'),
    ('Testable', 'The story must have defined acceptance criteria that can be tested.', 'Are there clear acceptance criteria to confirm completion?');

-- Insert a sample tester
INSERT INTO testers (name, email) VALUES
('Test User', 'test@example.com') ON CONFLICT (email) DO NOTHING;