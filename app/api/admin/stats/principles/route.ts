import { NextResponse } from "next/server"


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get("storyId")

    // In a real implementation, this would query the database with filters
    // For now, we'll return mock data
    const mockPrincipleStats = [
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
    ]

    // Filter by storyId if provided
    const filteredStats = storyId
      ? mockPrincipleStats.filter((stat) => stat.storyId === Number.parseInt(storyId))
      : mockPrincipleStats

    return NextResponse.json({ success: true, data: filteredStats })
  } catch (error) {
    console.error("Error fetching principle statistics:", error)
    return NextResponse.json({ error: "Failed to fetch principle statistics" }, { status: 500 })
  }
}
