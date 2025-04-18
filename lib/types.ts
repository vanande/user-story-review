// Interface for the structure of user stories directly from merged.json
export interface RawUserStory {
  user_story: string
  acceptance_criteria: string[]
  independent?: boolean
  negotiable?: boolean
  valuable?: boolean
  estimable?: boolean
  small?: boolean
  testable?: boolean
}

// Interface for the application's representation of a user story
export interface UserStory {
  id: number
  title: string
  description: string
  acceptance_criteria: string[]
  independent?: boolean
  negotiable?: boolean
  valuable?: boolean
  estimable?: boolean
  small?: boolean
  testable?: boolean
}

export interface InvestPrinciple {
  id: string
  label: string
  description: string
  question: string
}

export interface StoryEvaluation {
  storyId: number
  evaluations: Record<string, string>
  additionalFeedback: string
  reviewerEmail: string
  timestamp: Date
}

export interface FeedbackData {
  storyId: number
  evaluations: Record<string, string>
  additionalFeedback: string
  email: string
}

export interface Epic {
  epic: string
  user_stories: RawUserStory[]
}

export interface MergedData {
  [key: string]: {
    epics: Epic[]
  }
}
