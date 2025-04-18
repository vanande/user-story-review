import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET() {
  try {
    // In a real implementation, this would query the database
    // For now, we'll return the INVEST principles
    const principles = [
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
    ]

    return NextResponse.json({ success: true, data: principles })
  } catch (error) {
    console.error("Error fetching principles:", error)
    return NextResponse.json({ error: "Failed to fetch principles" }, { status: 500 })
  }
}
