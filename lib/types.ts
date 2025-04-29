// Interface for the structure of user stories directly from merged.json
export interface RawUserStory {
  user_story: string;
  acceptance_criteria?: string[]; // Made optional as some examples might lack it
  independent?: boolean;
  negotiable?: boolean;
  valuable?: boolean;
  estimable?: boolean;
  small?: boolean;
  testable?: boolean;
}

// Interface for the application's representation of a user story (fetched from DB)
export interface UserStory {
  id: number;
  title: string; // This might be the truncated title from DB
  description: string; // This is the full user_story text
  acceptance_criteria: string[]; // Parsed from JSON string
  source_key?: string | null; // Added - from dataset source key
  epic_name?: string | null;  // Added - from epic name
  independent?: boolean | null; // Allow null if DB stores null or value not present
  negotiable?: boolean | null;
  valuable?: boolean | null;
  estimable?: boolean | null;
  small?: boolean | null;
  testable?: boolean | null;
}

export interface InvestPrinciple {
  id: string;
  label: string;
  description: string;
  question: string;
}

// Removed StoryEvaluation as it wasn't used actively

export interface FeedbackData {
  storyId: number;
  evaluations: Record<string, string>; // Maps Principle Label (e.g., "Independent") to "yes"/"partial"/"no"
  additionalFeedback: string;
  email: string; // Submitter's email
}

// Types related to raw JSON structure (might not be needed directly in frontend components)
export interface Epic {
  epic: string;
  user_stories: RawUserStory[];
}

export interface MergedData {
  [key: string]: { // The source_key (e.g., "llm", "rag+CoT")
    epics: Epic[];
  };
}