import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real implementation, this would query active review sessions
    // For now, we'll return mock data
    const mockActiveReviews = [
      {
        id: 1,
        testerId: 101,
        testerName: "John Doe",
        storyId: 1,
        storyTitle: "User Authentication",
        startedAt: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
        progress: 33,
      },
      {
        id: 2,
        testerId: 102,
        testerName: "Jane Smith",
        storyId: 2,
        storyTitle: "Search Functionality",
        startedAt: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
        progress: 67,
      },
      {
        id: 3,
        testerId: 103,
        testerName: "Bob Johnson",
        storyId: 3,
        storyTitle: "Shopping Cart",
        startedAt: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
        progress: 83,
      },
    ]

    return NextResponse.json({ success: true, data: mockActiveReviews })
  } catch (error) {
    console.error("Error fetching active reviews:", error)
    return NextResponse.json({ error: "Failed to fetch active reviews" }, { status: 500 })
  }
}
