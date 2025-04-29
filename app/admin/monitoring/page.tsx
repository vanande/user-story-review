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
  // ... existing state (useMockData, loading, error, data states, selectedStory, selectedPrinciple) ...
  const [useMockData, setUseMockData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userStories, setUserStories] = useState<any[]>([]); // Use appropriate types
  const [principles, setPrinciples] = useState<any[]>([]);
  const [activeReviews, setActiveReviews] = useState<any[]>([]); // Replace with RecentReviews later
  const [principleStats, setPrincipleStats] = useState<any[]>([]);
  const [storyStats, setStoryStats] = useState<any[]>([]);

  const [selectedStory, setSelectedStory] = useState<string>("all");
  const [selectedPrinciple, setSelectedPrinciple] = useState<string>("all");


  // ... useEffect and fetchRealData function (adapt API endpoints if needed) ...
  useEffect(() => {
    const fetchData = async (mock: boolean) => {
      setLoading(true);
      setError(null);
      if (mock) {
        // Set mock data (ensure mock data structure matches fetched data)
        setUserStories(mockUserStories);
        setPrinciples(mockPrinciples);
        setActiveReviews(mockActiveReviews); // Use mock active reviews for now
        setPrincipleStats(mockPrincipleStats);
        setStoryStats(mockStoryStats);
        setLoading(false);
      } else {
        await fetchRealData(); // Call the existing fetchRealData
      }
    };
    fetchData(useMockData);
  }, [useMockData]); // Re-fetch when mock data toggle changes

  const fetchRealData = async () => {
    // Existing fetch logic... ensure APIs return data from DB now
    setLoading(true);
    setError(null);
    try {
      const [storiesRes, principlesRes, activeRes, principleStatsRes, storyStatsRes] = await Promise.all([
        fetch("/api/admin/stories"),
        fetch("/api/admin/principles"),
        fetch("/api/admin/active-reviews"), // Keep fetching active for now, change later
        fetch("/api/admin/stats/principles" + (selectedStory !== 'all' ? `?storyId=${selectedStory}` : '')),
        fetch("/api/admin/stats/stories" + (selectedPrinciple !== 'all' ? `?principleId=${selectedPrinciple}` : '')),
      ]);

      if (!storiesRes.ok || !principlesRes.ok || !activeRes.ok || !principleStatsRes.ok || !storyStatsRes.ok) {
        throw new Error("Failed to fetch one or more data sources");
      }

      const storiesData = await storiesRes.json();
      const principlesData = await principlesRes.json();
      const activeData = await activeRes.json();
      const principleStatsData = await principleStatsRes.json();
      const storyStatsData = await storyStatsRes.json();

      setUserStories(storiesData.data || []);
      setPrinciples(principlesData.data || []);
      setActiveReviews(activeData.data || []); // Still using active reviews endpoint
      setPrincipleStats(principleStatsData.data || []);
      setStoryStats(storyStatsData.data || []);

    } catch (err) {
      console.error("Error fetching real data:", err);
      setError("Failed to fetch real-time data. Displaying cached or mock data.");
      // Optional: Revert to mock data on error? Or show cached?
      // setUseMockData(true); // Example: revert to mock on error
    } finally {
      setLoading(false);
    }
  };

  // --- ADDED: Effect to refetch stats when filters change ---
  useEffect(() => {
    // Only refetch stats if not using mock data
    if (!useMockData) {
      const refetchStats = async () => {
        setLoading(true); // Indicate loading for stats only
        try {
          const [principleStatsRes, storyStatsRes] = await Promise.all([
            fetch("/api/admin/stats/principles" + (selectedStory !== 'all' ? `?storyId=${selectedStory}` : '')),
            fetch("/api/admin/stats/stories" + (selectedPrinciple !== 'all' ? `?principleId=${selectedPrinciple}` : '')),
          ]);
          if (!principleStatsRes.ok || !storyStatsRes.ok) {
            throw new Error("Failed to fetch filtered stats");
          }
          const principleStatsData = await principleStatsRes.json();
          const storyStatsData = await storyStatsRes.json();
          setPrincipleStats(principleStatsData.data || []);
          setStoryStats(storyStatsData.data || []);
        } catch (err) {
          console.error("Error fetching filtered stats:", err);
          setError("Failed to fetch filtered statistics.");
        } finally {
          setLoading(false);
        }
      };
      refetchStats();
    } else {
      // Apply filtering to mock data if using mock data
      const filteredPrinciple = selectedStory === "all"
          ? mockPrincipleStats
          : mockPrincipleStats.filter((stat) => stat.storyId === Number.parseInt(selectedStory));
      const filteredStory = selectedPrinciple === "all"
          ? mockStoryStats
          : mockStoryStats.filter((stat) => stat.principleId === selectedPrinciple);
      setPrincipleStats(filteredPrinciple);
      setStoryStats(filteredStory);
    }
  }, [selectedStory, selectedPrinciple, useMockData]); // Add useMockData dependency
  // ---------------------------------------------------------


  // Filter logic for display (now primarily handled by API or useEffect for mocks)
  // These can remain simple references to the state variables
  const filteredPrincipleStats = principleStats;
  const filteredStoryStats = storyStats;

  // Calculate aggregate stats for top cards (using current state data)
  const totalActiveReviews = activeReviews.length; // Replace with recent reviews logic later
  const totalCompletedReviews = storyStats.reduce((sum, stat) => sum + (stat.totalReviews || 0), 0) / principles.length; // Approximate total reviews
  const overallRatings = {
    yes: principleStats.reduce((sum, stat) => sum + (stat.yesCount || 0), 0),
    partial: principleStats.reduce((sum, stat) => sum + (stat.partialCount || 0), 0),
    no: principleStats.reduce((sum, stat) => sum + (stat.noCount || 0), 0),
  };
  const overallPieData = [
    { name: "Yes", value: overallRatings.yes },
    { name: "Partially", value: overallRatings.partial },
    { name: "No", value: overallRatings.no },
  ].filter(d => d.value > 0); // Filter out zero values for cleaner pie chart


  return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col gap-6">
          {/* Header Section (unchanged) */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Review Monitoring Dashboard</h1>
            <div className="flex items-center space-x-4">
              {/* Mock Data Toggle */}
              <div className="flex items-center space-x-2">
                <Switch id="mock-data" checked={useMockData} onCheckedChange={setUseMockData} aria-label="Toggle Mock Data"/>
                <Label htmlFor="mock-data">Use Mock Data</Label>
              </div>
              {/* Refresh Button */}
              <Button onClick={() => fetchRealData()} disabled={loading || useMockData} size="sm">
                {loading && !useMockData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Refresh Live Data
              </Button>
            </div>
          </div>

          {/* Error Alert (unchanged) */}
          {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}

          {/* Top Cards Grid (unchanged structure, data uses calculations above) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card> {/* Active Reviews Card */}
              <CardHeader> <CardTitle>Active/Recent Sessions</CardTitle> <CardDescription>Currently reviewing or recently submitted</CardDescription> </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{totalActiveReviews}</div>
                {/* Display story titles from active/recent */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {Array.from(new Set(activeReviews.slice(0, 5).map((r) => r.storyTitle))).map((title) => (
                      <Badge key={title} variant="outline" className="text-xs">{title}</Badge>
                  ))}
                  {activeReviews.length > 5 && <Badge variant="secondary">...</Badge>}
                </div>
              </CardContent>
            </Card>
            <Card> {/* Completed Reviews Card */}
              <CardHeader> <CardTitle>Completed Reviews</CardTitle> <CardDescription>Total stories reviewed</CardDescription> </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{Math.round(totalCompletedReviews)}</div>
                {/* Small bar chart of top reviewed stories */}
                <div className="mt-4 h-[100px]"> {/* Set fixed height */}
                  {storyStats.length > 0 ? (
                      <BarChart
                          data={storyStats.sort((a,b) => (b.totalReviews || 0) - (a.totalReviews || 0)).slice(0, 5).map(s => ({ name: s.storyTitle.slice(0,15)+'...', value: s.totalReviews || 0 }))}
                          index="name" categories={["value"]} colors={["#3b82f6"]}
                          valueFormatter={(v) => `${v}`} height={100}
                      />
                  ) : <p className="text-xs text-muted-foreground">No review data.</p>}
                </div>
              </CardContent>
            </Card>
            <Card> {/* Overall Ratings Card */}
              <CardHeader> <CardTitle>Overall Ratings</CardTitle> <CardDescription>Distribution across all principles</CardDescription> </CardHeader>
              <CardContent className="flex justify-center items-center h-[140px]"> {/* Fixed height */}
                {overallPieData.length > 0 ? (
                    <PieChart data={overallPieData} index="name" categories={["value"]} colors={["#22c55e", "#f59e0b", "#ef4444"]} height={140} />
                ) : <p className="text-xs text-muted-foreground">No rating data.</p>}
              </CardContent>
            </Card>
          </div>

          {/* --- MODIFIED: Lower Section Grid --- */}
          {/* Changed from md:grid-cols-2 to grid-cols-1 */}
          <div className="grid grid-cols-1 gap-6">

            {/* Active/Recent Reviews Table (Full Width) - Replace content later */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Active/Recent Review Sessions</h2>
              </div>
              <ActiveReviewsTable data={activeReviews} /> {/* Replace with recent reviews component later */}
            </div>

            {/* Statistics Section (Full Width) */}
            <div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <h2 className="text-xl font-semibold">Filter Statistics</h2>
                {/* Filters - kept side-by-side */}
                <div className="flex flex-wrap gap-2">
                  <Select value={selectedStory} onValueChange={setSelectedStory} disabled={loading}>
                    <SelectTrigger className="w-full md:w-[200px]"> <SelectValue placeholder="Filter by Story" /> </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stories</SelectItem>
                      {userStories.map((story) => <SelectItem key={story.id} value={String(story.id)}>{story.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selectedPrinciple} onValueChange={setSelectedPrinciple} disabled={loading}>
                    <SelectTrigger className="w-full md:w-[200px]"> <SelectValue placeholder="Filter by Principle" /> </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Principles</SelectItem>
                      {principles.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tabs for Stats (Full Width) */}
              <Tabs defaultValue="principles" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="principles">Stats by Principle</TabsTrigger>
                  <TabsTrigger value="stories">Stats by Story</TabsTrigger>
                </TabsList>

                <TabsContent value="principles" className="space-y-4 mt-4">
                  {loading ? <p>Loading statistics...</p> :
                      filteredPrincipleStats.length === 0 ? <p className="text-muted-foreground text-sm">No principle statistics match the current filter.</p> :
                          filteredPrincipleStats.map((stat) => (
                              <PrincipleStatisticsCard key={stat.id} data={stat} />
                          ))}
                </TabsContent>

                <TabsContent value="stories" className="space-y-4 mt-4">
                  {loading ? <p>Loading statistics...</p> :
                      filteredStoryStats.length === 0 ? <p className="text-muted-foreground text-sm">No story statistics match the current filter.</p> :
                          filteredStoryStats.map((stat) => (
                              <StoryStatisticsCard key={stat.id} data={stat} />
                          ))}
                </TabsContent>
              </Tabs>
            </div>
          </div>
          {/* -------------------------------- */}
        </div>
      </div>
  );
}
