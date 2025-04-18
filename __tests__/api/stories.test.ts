import { NextRequest } from "next/server"
import { GET } from "@/app/api/stories/route"
import { Pool } from "pg"

// Mock the pg Pool
jest.mock("pg", () => {
  const mPool = {
    connect: jest.fn(),
    query: jest.fn(),
  }
  return { Pool: jest.fn(() => mPool) }
})

describe("Stories API", () => {
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

  it("should return a list of stories", async () => {
    // Mock the database response
    mockClient.query.mockResolvedValueOnce({
      rows: [
        { id: 1, title: "User Authentication", description: "As a user, I want to log in" },
        { id: 2, title: "Search Functionality", description: "As a user, I want to search" },
      ],
    })

    // Create a mock request
    const request = new NextRequest("http://localhost:3000/api/stories")

    // Call the API handler
    const response = await GET(request)
    const data = await response.json()

    // Assertions
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.stories).toHaveLength(2)
    expect(data.stories[0].title).toBe("User Authentication")
    expect(data.stories[1].title).toBe("Search Functionality")

    // Verify database was queried
    expect(mockPool.connect).toHaveBeenCalled()
    expect(mockClient.query).toHaveBeenCalledWith("SELECT * FROM user_stories ORDER BY id")
    expect(mockClient.release).toHaveBeenCalled()
  })

  it("should handle database errors", async () => {
    // Mock a database error
    mockClient.query.mockRejectedValueOnce(new Error("Database connection failed"))

    // Create a mock request
    const request = new NextRequest("http://localhost:3000/api/stories")

    // Call the API handler
    const response = await GET(request)
    const data = await response.json()

    // Assertions
    expect(response.status).toBe(500)
    expect(data.error).toBe("Failed to fetch stories")

    // Verify database was queried
    expect(mockPool.connect).toHaveBeenCalled()
    expect(mockClient.release).toHaveBeenCalled()
  })
})
