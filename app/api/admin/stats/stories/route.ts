import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const principleId = searchParams.get("principleId")

    // In a real implementation, this would query the database with filters
    // For now, we'll return mock data
    const mockStoryStats = [
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
    ]

    // Filter by principleId if provided
    const filteredStats = principleId
      ? mockStoryStats.filter((stat) => stat.principleId === principleId)
      : mockStoryStats

    return NextResponse.json({ success: true, data: filteredStats })
  } catch (error) {
    console.error("Error fetching story statistics:", error)
    return NextResponse.json({ error: "Failed to fetch story statistics" }, { status: 500 })
  }
}
