import { NextRequest } from "next/server"
import { POST } from "@/app/api/feedback/route"
import { Pool } from "pg"

// Add Jest types
import "@testing-library/jest-dom"

// Mock the pg Pool
jest.mock("pg", () => {
  const mPool = {
    connect: jest.fn(),
    query: jest.fn(),
  }
  return { Pool: jest.fn(() => mPool) }
})

describe("Feedback API", () => {
  let mockPool: jest.Mocked<Pool>
  let mockClient: any

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Setup mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    }

    // Setup mock pool
    mockPool = new Pool() as jest.Mocked<Pool>
    ;(mockPool.connect as jest.Mock).mockResolvedValue(mockClient)
  })

  it("should store feedback successfully", async () => {
    // Mock the database responses
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // BEGIN transaction
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check if tester exists
      .mockResolvedValueOnce({ rows: [{ id: 123 }] }) // Insert review
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Get criterion ID for Independent
      .mockResolvedValueOnce({ rows: [] }) // Insert evaluation for Independent
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // Get criterion ID for Negotiable
      .mockResolvedValueOnce({ rows: [] }) // Insert evaluation for Negotiable
      .mockResolvedValueOnce({ rows: [] }) // COMMIT transaction

    // Create a mock request with feedback data
    const request = new NextRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storyId: 1,
        evaluations: {
          Independent: "yes",
          Negotiable: "partial",
        },
        additionalFeedback: "This is a good user story",
      }),
    })

    // Call the API handler
    const response = await POST(request)
    const data = await response.json()

    // Assertions
    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.message).toBe("Feedback stored successfully")
    expect(data.reviewId).toBe(123)

    // Verify database was queried correctly
    expect(mockPool.connect).toHaveBeenCalled()
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN")
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO reviews"),
      expect.arrayContaining([1, 1, "This is a good user story"]),
    )
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT")
    expect(mockClient.release).toHaveBeenCalled()
  })

  it("should handle missing required fields", async () => {
    // Create a mock request with missing required fields
    const request = new NextRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Missing storyId and evaluations
        additionalFeedback: "This is a good user story",
      }),
    })

    // Call the API handler
    const response = await POST(request)
    const data = await response.json()

    // Assertions
    expect(response.status).toBe(400)
    expect(data.error).toBe("Missing required fields")

    // Verify database was not queried
    expect(mockPool.connect).not.toHaveBeenCalled()
  })

  it("should handle database errors", async () => {
    // Mock a database error
    mockClient.query.mockRejectedValueOnce(new Error("Database connection failed"))

    // Create a mock request with feedback data
    const request = new NextRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storyId: 1,
        evaluations: {
          Independent: "yes",
        },
        additionalFeedback: "This is a good user story",
      }),
    })

    // Call the API handler
    const response = await POST(request)
    const data = await response.json()

    // Assertions
    expect(response.status).toBe(500)
    expect(data.error).toBe("Failed to process feedback")
    expect(data.details).toBe("Database connection failed")

    // Verify database was queried
    expect(mockPool.connect).toHaveBeenCalled()
    expect(mockClient.release).toHaveBeenCalled()
  })
})
