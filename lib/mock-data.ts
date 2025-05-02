export const mockUserStories = [
  {
    id: 1,
    source_key: "mock-llm",
    epic_name: "Authentication Epic",
    title: "User Authentication",
    description:
      "As a user, I want to log in to the application so that I can access my personalized dashboard.",
  },
  {
    id: 2,
    source_key: "mock-llm",
    epic_name: "Product Search Epic",
    title: "Search Functionality",
    description:
      "As a customer, I want to search for products by name so that I can quickly find what I'm looking for.",
  },
  {
    id: 3,
    source_key: "mock-rag",
    epic_name: "Shopping Experience Epic",
    title: "Shopping Cart",
    description: "As a shopper, I want to add items to my cart so that I can purchase them later.",
  },
  {
    id: 4,
    source_key: "mock-rag",
    epic_name: "Account Management Epic",
    title: "User Profile",
    description:
      "As a registered user, I want to update my profile information so that my account details are current.",
  },
  {
    id: 5,
    source_key: "mock-llm",
    epic_name: "Order Management Epic",
    title: "Order History",
    description:
      "As a customer, I want to view my order history so that I can track my past purchases.",
  },
];

export const mockPrinciples = [
  {
    id: "independent",
    label: "Independent",
    description: "The story is self-contained and not dependent on other stories.",
  },
  {
    id: "negotiable",
    label: "Negotiable",
    description: "Details can be discussed and refined between stakeholders.",
  },
  {
    id: "valuable",
    label: "Valuable",
    description: "The story delivers value to stakeholders.",
  },
  {
    id: "estimable",
    label: "Estimable",
    description: "The size of the story can be estimated with reasonable accuracy.",
  },
  {
    id: "small",
    label: "Small",
    description: "The story is small enough to be completed in one sprint.",
  },
  {
    id: "testable",
    label: "Testable",
    description: "The story can be tested to verify it meets requirements.",
  },
];

export const mockActiveReviews = [
  {
    id: 1,
    testerId: 101,
    testerName: "John Doe",
    storyId: 1,
    storyTitle: "User Authentication",
    startedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    progress: 33,
  },
  {
    id: 2,
    testerId: 102,
    testerName: "Jane Smith",
    storyId: 2,
    storyTitle: "Search Functionality",
    startedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    progress: 67,
  },
  {
    id: 3,
    testerId: 103,
    testerName: "Bob Johnson",
    storyId: 3,
    storyTitle: "Shopping Cart",
    startedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    progress: 83,
  },
];

export const mockPrincipleStats = [
  {
    id: "stat1",
    principleId: "independent",
    principleName: "Independent",
    storyId: 1,
    storyTitle: "User Authentication",
    yesCount: 12,
    partialCount: 5,
    noCount: 3,
    totalReviews: 20,
  },
  {
    id: "stat2",
    principleId: "negotiable",
    principleName: "Negotiable",
    storyId: 1,
    storyTitle: "User Authentication",
    yesCount: 15,
    partialCount: 3,
    noCount: 2,
    totalReviews: 20,
  },
  {
    id: "stat3",
    principleId: "valuable",
    principleName: "Valuable",
    storyId: 1,
    storyTitle: "User Authentication",
    yesCount: 18,
    partialCount: 2,
    noCount: 0,
    totalReviews: 20,
  },
  {
    id: "stat4",
    principleId: "independent",
    principleName: "Independent",
    storyId: 2,
    storyTitle: "Search Functionality",
    yesCount: 8,
    partialCount: 7,
    noCount: 5,
    totalReviews: 20,
  },
  {
    id: "stat5",
    principleId: "negotiable",
    principleName: "Negotiable",
    storyId: 2,
    storyTitle: "Search Functionality",
    yesCount: 10,
    partialCount: 6,
    noCount: 4,
    totalReviews: 20,
  },
  {
    id: "stat6",
    principleId: "valuable",
    principleName: "Valuable",
    storyId: 2,
    storyTitle: "Search Functionality",
    yesCount: 16,
    partialCount: 3,
    noCount: 1,
    totalReviews: 20,
  },
];

export const mockStoryStats = [
  {
    id: "story-stat1",
    storyId: 1,
    storyTitle: "User Authentication",
    principleId: "independent",
    principleName: "Independent",
    averageRating: 4.2,
    totalReviews: 20,
    meetsCriteria: 17,
  },
  {
    id: "story-stat2",
    storyId: 1,
    storyTitle: "User Authentication",
    principleId: "negotiable",
    principleName: "Negotiable",
    averageRating: 4.5,
    totalReviews: 20,
    meetsCriteria: 18,
  },
  {
    id: "story-stat3",
    storyId: 2,
    storyTitle: "Search Functionality",
    principleId: "independent",
    principleName: "Independent",
    averageRating: 3.8,
    totalReviews: 20,
    meetsCriteria: 15,
  },
  {
    id: "story-stat4",
    storyId: 2,
    storyTitle: "Search Functionality",
    principleId: "valuable",
    principleName: "Valuable",
    averageRating: 4.1,
    totalReviews: 20,
    meetsCriteria: 16,
  },
];
export interface TesterDistributionData {
  testerId: number;
  testerName: string;
  reviewCount: number;
}

export const mockTesterDistribution: TesterDistributionData[] = [
  { testerId: 101, testerName: "v.khatchatrian@groupeonepoint.com", reviewCount: 25 },
  { testerId: 102, testerName: "m.ortega@groupeonepoint.com", reviewCount: 18 },
  { testerId: 103, testerName: "h.imhah@groupeonepoint.com", reviewCount: 15 },
  { testerId: 104, testerName: "alice.reviewer@example.com", reviewCount: 10 },
  { testerId: 105, testerName: "bob.tester@sample.net", reviewCount: 5 },
  { testerId: 106, testerName: "charlie.feedback@domain.org", reviewCount: 2 },
];

export interface SubmissionCountData {
  count: number;
}

export const mockSubmissionCount: SubmissionCountData = { count: 75 };
