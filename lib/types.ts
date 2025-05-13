export interface RawUserStory {
  user_story: string;
  acceptance_criteria?: string[];
  independent?: boolean;
  negotiable?: boolean;
  valuable?: boolean;
  estimable?: boolean;
  small?: boolean;
  testable?: boolean;
}

export interface UserStory {
  id: number;
  title: string;
  description: string;
  acceptance_criteria: string[];
  source_key?: string | null;
  epic_name?: string | null;
  epicId?: string | null;
  independent?: boolean | null;
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

export interface FeedbackData {
  storyId: number;
  evaluations: Record<string, string>;
  additionalFeedback: string;
  email: string;
}

export interface Epic {
  epic: string;
  user_stories: RawUserStory[];
}

export interface MergedData {
  [key: string]: {
    epics: Epic[];
  };
}
