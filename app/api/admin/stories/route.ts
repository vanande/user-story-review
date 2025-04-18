import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET() {
  try {
    // In a real implementation, this would query the database
    // For now, we'll return mock data
    const mockUserStories = [
      {
        id: 1,
        title: "User Authentication",
        description: "As a user, I want to log in to the application so that I can access my personalized dashboard.",
      },
      {
        id: 2,
        title: "Search Functionality",
        description:
          "As a customer, I want to search for products by name so that I can quickly find what I'm looking for.",
      },
      {
        id: 3,
        title: "Shopping Cart",
        description: "As a shopper, I want to add items to my cart so that I can purchase them later.",
      },
      {
        id: 4,
        title: "User Profile",
        description:
          "As a registered user, I want to update my profile information so that my account details are current.",
      },
      {
        id: 5,
        title: "Order History",
        description: "As a customer, I want to view my order history so that I can track my past purchases.",
      },
    ]

    return NextResponse.json({ success: true, data: mockUserStories })
  } catch (error) {
    console.error("Error fetching stories:", error)
    return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 })
  }
}
