"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChart, PieChart } from "@/components/charts"
import { Loader2, AlertCircle, Users } from "lucide-react"
import { ActiveReviewsTable } from "@/components/admin/active-reviews-table"
import { StoryStatisticsCard } from "@/components/admin/story-statistics-card"
import { PrincipleStatisticsCard } from "@/components/admin/principle-statistics-card"
import { mockUserStories, mockPrinciples, mockActiveReviews, mockPrincipleStats, mockStoryStats } from "@/lib/mock-data"

export default function AdminMonitoringPage() {
  const [useMockData, setUseMockData] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [userStories, setUserStories] = useState(mockUserStories)
  const [principles, setPrinciples] = useState(mockPrinciples)
  const [activeReviews, setActiveReviews] = useState(mockActiveReviews)
  const [principleStats, setPrincipleStats] = useState(mockPrincipleStats)
  const [storyStats, setStoryStats] = useState(mockStoryStats)

  const [selectedStory, setSelectedStory] = useState<string>("all")
  const [selectedPrinciple, setSelectedPrinciple] = useState<string>("all")

  // Fetch real data when toggle is switched
  useEffect(() => {
    if (!useMockData) {
      fetchRealData()
    }
  }, [useMockData])

  const fetchRealData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch data from API endpoints
      const [storiesResponse, principlesResponse, activeReviewsResponse, principleStatsResponse, storyStatsResponse] =
        await Promise.all([
          fetch("/api/admin/stories"),
          fetch("/api/admin/principles"),
          fetch("/api/admin/active-reviews"),
          fetch("/api/admin/stats/principles"),
          fetch("/api/admin/stats/stories"),
        ])

      // Check for errors
      if (
        !storiesResponse.ok ||
        !principlesResponse.ok ||
        !activeReviewsResponse.ok ||
        !principleStatsResponse.ok ||
        !storyStatsResponse.ok
      ) {
        throw new Error("Failed to fetch data from one or more endpoints")
      }

      // Parse responses
      const stories = await storiesResponse.json()
      const principles = await principlesResponse.json()
      const activeReviews = await activeReviewsResponse.json()
      const principleStats = await principleStatsResponse.json()
      const storyStats = await storyStatsResponse.json()

      // Update state
      setUserStories(stories.data)
      setPrinciples(principles.data)
      setActiveReviews(activeReviews.data)
      setPrincipleStats(principleStats.data)
      setStoryStats(storyStats.data)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to fetch data. Please try again or use mock data.")
      // Revert to mock data
      setUseMockData(true)
    } finally {
      setLoading(false)
    }
  }

  // Filter data based on selections
  const filteredPrincipleStats =
    selectedStory === "all"
      ? principleStats
      : principleStats.filter((stat) => stat.storyId === Number.parseInt(selectedStory))

  const filteredStoryStats =
    selectedPrinciple === "all" ? storyStats : storyStats.filter((stat) => stat.principleId === selectedPrinciple)

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Review Monitoring Dashboard</h1>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch id="mock-data" checked={useMockData} onCheckedChange={setUseMockData} />
              <Label htmlFor="mock-data">Use Mock Data</Label>
            </div>

            <Button onClick={() => (useMockData ? null : fetchRealData())} disabled={loading || useMockData}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading
                </>
              ) : (
                "Refresh Data"
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Active Reviews</CardTitle>
              <CardDescription>Currently ongoing review sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center text-4xl font-bold">
                {activeReviews.length}
                <Users className="ml-2 h-6 w-6 text-muted-foreground" />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.from(new Set(activeReviews.map((review) => review.storyTitle))).map((title) => (
                  <Badge key={title} variant="outline">
                    {title}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Completed Reviews</CardTitle>
              <CardDescription>Total reviews submitted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center text-4xl font-bold">
                {storyStats.reduce((sum, stat) => sum + stat.totalReviews, 0)}
              </div>
              <div className="mt-4">
                <BarChart
                  data={userStories.slice(0, 5).map((story) => ({
                    name: story.title.split(" ").slice(0, 2).join(" "),
                    value: storyStats.find((stat) => stat.storyId === story.id)?.totalReviews || 0,
                  }))}
                  index="name"
                  categories={["value"]}
                  colors={["#2563eb"]}
                  valueFormatter={(value) => `${value} reviews`}
                  height={150}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Overall Ratings</CardTitle>
              <CardDescription>Average ratings across all principles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <PieChart
                  data={[
                    { name: "Yes", value: principleStats.reduce((sum, stat) => sum + stat.yesCount, 0) },
                    { name: "Partially", value: principleStats.reduce((sum, stat) => sum + stat.partialCount, 0) },
                    { name: "No", value: principleStats.reduce((sum, stat) => sum + stat.noCount, 0) },
                  ]}
                  index="name"
                  categories={["value"]}
                  colors={["#22c55e", "#f59e0b", "#ef4444"]}
                  height={150}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Active Review Sessions</h2>
            </div>
            <ActiveReviewsTable data={activeReviews} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Filter Statistics</h2>
              <div className="flex gap-2">
                <Select value={selectedStory} onValueChange={setSelectedStory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Story" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stories</SelectItem>
                    {userStories.map((story) => (
                      <SelectItem key={story.id} value={story.id.toString()}>
                        {story.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPrinciple} onValueChange={setSelectedPrinciple}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Principle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Principles</SelectItem>
                    {principles.map((principle) => (
                      <SelectItem key={principle.id} value={principle.id}>
                        {principle.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs defaultValue="principles">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="principles">By Principle</TabsTrigger>
                <TabsTrigger value="stories">By Story</TabsTrigger>
              </TabsList>

              <TabsContent value="principles" className="space-y-4 mt-4">
                {filteredPrincipleStats.map((stat) => (
                  <PrincipleStatisticsCard key={stat.id} data={stat} />
                ))}
              </TabsContent>

              <TabsContent value="stories" className="space-y-4 mt-4">
                {filteredStoryStats.map((stat) => (
                  <StoryStatisticsCard key={stat.id} data={stat} />
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
