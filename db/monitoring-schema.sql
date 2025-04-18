-- Active review sessions table
CREATE TABLE IF NOT EXISTS active_review_sessions (
  id SERIAL PRIMARY KEY,
  tester_id INTEGER NOT NULL REFERENCES testers(id),
  story_id INTEGER NOT NULL REFERENCES user_stories(id),
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
  progress INTEGER NOT NULL DEFAULT 0,
  completed_principles TEXT[] DEFAULT '{}',
  
  CONSTRAINT unique_active_session UNIQUE (tester_id, story_id)
);

-- Review statistics view
CREATE OR REPLACE VIEW review_statistics AS
SELECT 
  ec.id AS criterion_id,
  ec.name AS criterion_name,
  s.id AS story_id,
  s.title AS story_title,
  COUNT(ce.id) AS total_reviews,
  SUM(CASE WHEN ce.rating >= 4 THEN 1 ELSE 0 END) AS meets_criteria,
  AVG(ce.rating) AS average_rating,
  SUM(CASE WHEN ce.rating = 5 THEN 1 ELSE 0 END) AS yes_count,
  SUM(CASE WHEN ce.rating = 3 THEN 1 ELSE 0 END) AS partial_count,
  SUM(CASE WHEN ce.rating <= 2 THEN 1 ELSE 0 END) AS no_count
FROM 
  criterion_evaluations ce
JOIN 
  evaluation_criteria ec ON ce.criterion_id = ec.id
JOIN 
  reviews r ON ce.review_id = r.id
JOIN 
  user_stories s ON r.story_id = s.id
GROUP BY 
  ec.id, ec.name, s.id, s.title;

-- Function to start a review session
CREATE OR REPLACE FUNCTION start_review_session(p_tester_id INTEGER, p_story_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  session_id INTEGER;
BEGIN
  -- Delete any existing session for this tester and story
  DELETE FROM active_review_sessions 
  WHERE tester_id = p_tester_id AND story_id = p_story_id;
  
  -- Insert new session
  INSERT INTO active_review_sessions (tester_id, story_id)
  VALUES (p_tester_id, p_story_id)
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update review session progress
CREATE OR REPLACE FUNCTION update_review_progress(
  p_session_id INTEGER, 
  p_progress INTEGER, 
  p_completed_principle TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE active_review_sessions
  SET 
    progress = p_progress,
    last_activity = NOW(),
    completed_principles = 
      CASE 
        WHEN p_completed_principle IS NOT NULL 
        THEN array_append(completed_principles, p_completed_principle)
        ELSE completed_principles
      END
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a review session
CREATE OR REPLACE FUNCTION complete_review_session(p_session_id INTEGER)
RETURNS VOID AS $$
BEGIN
  DELETE FROM active_review_sessions WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;
