// app/api/admin/reviews/route.ts
import { NextResponse } from "next/server"


export async function GET() {
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL is not defined, returning mock data")
      return NextResponse.json({
        reviews: getMockReviews(),
      })
    }

    const query = `
      SELECT 
        r.id as review_id,
        s.title as story_title,
        t.name as tester_name,
        r.additional_feedback,
        json_agg(
          json_build_object(
            'criterion', ec.name,
            'rating', ce.rating
          )
        ) as evaluations
      FROM reviews r
      JOIN user_stories s ON r.story_id = s.id
      JOIN testers t ON r.tester_id = t.id
      JOIN criterion_evaluations ce ON ce.review_id = r.id
      JOIN evaluation_criteria ec ON ce.criterion_id = ec.id
      GROUP BY r.id, s.title, t.name
      ORDER BY r.id DESC
    `


      return NextResponse.json({
        reviews: getMockReviews(),
      })
    
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

// Mock data function
function getMockReviews() {
  return [
    {
      review_id: 1,
      story_title: "User Authentication",
      tester_name: "John Doe",
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
      tester_name: "Jane Smith",
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
    {
      review_id: 3,
      story_title: "Shopping Cart",
      tester_name: "Bob Johnson",
      additional_feedback: "Very clear requirements, easy to test.",
      evaluations: [
        { criterion: "Independent", rating: 5 },
        { criterion: "Negotiable", rating: 3 },
        { criterion: "Valuable", rating: 5 },
        { criterion: "Estimable", rating: 4 },
        { criterion: "Small", rating: 5 },
        { criterion: "Testable", rating: 5 },
      ],
    },
  ]
}
