"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Mock data to use when API fails
const mockReviews = [
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

export default function AdminPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useMockData, setUseMockData] = useState(false)

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)

    try {
      if (useMockData) {
        setReviews(mockReviews)
        setLoading(false)
        return
      }

      // Use a relative URL instead of depending on NEXT_PUBLIC_API_URL
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin/reviews`, {
        // Add cache: 'no-store' to ensure fresh data
        cache: "no-store",
      })

      // Check if the response is OK
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText}`)
      }

      // Check if the response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response")
      }

      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (err) {
      console.error("Error fetching reviews:", err)
      setError(`Failed to fetch reviews: ${err instanceof Error ? err.message : String(err)}`)

      // Fallback to mock data
      if (!useMockData) {
        setUseMockData(true)
        setReviews(mockReviews)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [useMockData])

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Story Reviews Dashboard</h1>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch id="mock-data" checked={useMockData} onCheckedChange={setUseMockData} />
            <Label htmlFor="mock-data">Use Mock Data</Label>
          </div>

          <Button onClick={fetchReviews} disabled={loading}>
            {loading ? "Loading..." : "Refresh Data"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {useMockData && !error && (
        <Alert className="mb-6 bg-yellow-50 text-yellow-800 border-yellow-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Using Mock Data</AlertTitle>
          <AlertDescription>
            Currently displaying mock data. Toggle the switch above to attempt fetching real data.
          </AlertDescription>
        </Alert>
      )}

      <DataTable columns={columns} data={reviews} />
    </div>
  )
}
