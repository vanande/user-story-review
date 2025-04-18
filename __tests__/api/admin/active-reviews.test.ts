import { NextRequest } from "next/server"
import { GET } from "@/app/api/admin/active-reviews/route"
import { describe, it, expect } from "@jest/globals"

describe("Active Reviews API", () => {
  it("returns active review sessions", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/active-reviews")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)

    // Check structure of returned data
    if (data.data.length > 0) {
      const firstReview = data.data[0]
      expect(firstReview).toHaveProperty("id")
      expect(firstReview).toHaveProperty("testerId")
      expect(firstReview).toHaveProperty("testerName")
      expect(firstReview).toHaveProperty("storyId")
      expect(firstReview).toHaveProperty("storyTitle")
      expect(firstReview).toHaveProperty("startedAt")
      expect(firstReview).toHaveProperty("progress")
    }
  })
})
