import { NextResponse } from "next/server";

function getMockReviews() {
  return [
    {
      review_id: 1,
      story_title: "User Authentication",
      tester_name: "John Doe (Mock)",
      additional_feedback: "Good user story, clear and concise.",
      evaluations: [
        { criterion: "Independent", rating: 5 },
        { criterion: "Negotiable", rating: 4 },
        { criterion: "Valuable", rating: 5 },
        { criterion: "Estimable", rating: 4 },
        { criterion: "Small", rating: 3 },
        { criterion: "Testable", rating: 5 },
      ],
    },
    {
      review_id: 2,
      story_title: "Search Functionality",
      tester_name: "Jane Smith (Mock)",
      additional_feedback: "Could be more specific about search criteria.",
      evaluations: [
        { criterion: "Independent", rating: 4 },
        { criterion: "Negotiable", rating: 5 },
        { criterion: "Valuable", rating: 5 },
        { criterion: "Estimable", rating: 3 },
        { criterion: "Small", rating: 4 },
        { criterion: "Testable", rating: 4 },
      ],
    },
  ];
}


export async function GET() {
  try {
    console.log("Admin reviews route returning mock data.");
    return NextResponse.json({
      reviews: getMockReviews(),
    });

  } catch (error) {
    console.error("Error fetching admin reviews (mock fallback):", error);
    return NextResponse.json({
      error: "Failed to fetch reviews, returning mock data.",
      reviews: getMockReviews()
    }, { status: 500 });
  }
}