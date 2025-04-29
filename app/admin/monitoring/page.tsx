// app/admin/monitoring/page.tsx
"use client";

import { useState, useEffect, SetStateAction } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, PieChart } from "@/components/charts";
import { Loader2, AlertCircle, History } from "lucide-react";
import { ActiveReviewsTable } from "@/components/admin/active-reviews-table"; // Will be replaced or adapted
import { StoryStatisticsCard } from "@/components/admin/story-statistics-card";
import { PrincipleStatisticsCard } from "@/components/admin/principle-statistics-card";
import { mockUserStories, mockPrinciples, mockActiveReviews, mockPrincipleStats, mockStoryStats } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";
import { generateShortStoryTitle, generateShortStatTitle } from "@/lib/utils"; // Import helpers
import { formatDistanceToNow } from "date-fns"; // Import for mock date display

// --- Interfaces ---
interface RecentReview {
  reviewId: number; submittedAt: string; testerName: string; storyTitle: string;
  storyId: number; testerId: number; source_key?: string | null; epic_name?: string | null; // Added for title generation
}
interface AdminStory { id: number; title: string; datasetName?: string; source_key?: string | null; epic_name?: string | null; } // Added fields
interface AdminPrinciple { id: string; label: string; description?: string; }
interface AdminPrincipleStat {
  id: string; principleId: number; principleName: string; storyId: number | null; storyTitle: string | null;
  source_key?: string | null; epic_name?: string | null; // Added fields
  yesCount: number; partialCount: number; noCount: number; totalReviews: number;
}
interface AdminStoryStat {
  id: string; storyId: number; storyTitle: string | null; source_key?: string | null; epic_name?: string | null; // Added fields
  principleIdNum: number | null; principleName: string | null; averageRating: number;
  totalReviews: number; meetsCriteria: number; principleId?: string;
}
// --- Mappings ---
const principleStringToIdMap: { [key: string]: number } = { independent: 1, negotiable: 2, valuable: 3, estimable: 4, small: 5, testable: 6 };
// ------------------


export default function AdminMonitoringPage() {
  // MODIFIED: Default useMockData to false
  const [useMockData, setUseMockData] = useState(false);
  // Loading states
  const [loadingAll, setLoadingAll] = useState(true); // Start loading true initially
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [userStories, setUserStories] = useState<AdminStory[]>([]);
  const [principles, setPrinciples] = useState<AdminPrinciple[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [principleStats, setPrincipleStats] = useState<AdminPrincipleStat[]>([]);
  const [storyStats, setStoryStats] = useState<AdminStoryStat[]>([]);

  // Filter states
  const [selectedStory, setSelectedStory] = useState<string>("all");
  const [selectedPrinciple, setSelectedPrinciple] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("1h");

  // --- Data Fetching Logic ---

  // Transform mock stats helper (unchanged)
  const transformMockStats = () => {
    const transformedPrincipleStats: AdminPrincipleStat[] = mockPrincipleStats
        .filter(stat => selectedStory === 'all' || stat.storyId === Number.parseInt(selectedStory))
        .map((stat, index) => {
          // Find corresponding mock story to get source/epic
          const mockStory = mockUserStories.find(s => s.id === stat.storyId);
          return {
            ...stat,
            id: `mock-principlestat-${stat.principleName}-${stat.storyId || 'all'}-${index}`,
            principleId: principleStringToIdMap[stat.principleId] ?? 0,
            source_key: mockStory?.source_key || null, // Add source/epic if available
            epic_name: mockStory?.epic_name || null,
          };
        });

    const transformedStoryStats: AdminStoryStat[] = mockStoryStats
        .filter(stat => selectedPrinciple === 'all' || stat.principleId === selectedPrinciple)
        .map((stat, index) => {
          const mockStory = mockUserStories.find(s => s.id === stat.storyId);
          return {
            ...stat,
            id: `mock-storystat-${stat.storyId}-${stat.principleName || 'all'}-${index}`,
            principleIdNum: principleStringToIdMap[stat.principleId] ?? null,
            principleId: stat.principleId,
            source_key: mockStory?.source_key || null,
            epic_name: mockStory?.epic_name || null,
          };
        });
    return { transformedPrincipleStats, transformedStoryStats };
  };

  // Transform mock active reviews to mock recent reviews with corrected dates and needed fields
  const transformMockRecentReviews = () => {
    // Map mock active reviews to simulate recent submissions
    // Add source_key/epic_name if available in your mockUserStories
    return mockActiveReviews.map((ar, index) => {
      const mockStory = mockUserStories.find(s => s.id === ar.storyId);
      // Simulate submission time based on index/progress to make them distinct
      const minutesAgo = (index * 5) + 1; // e.g., 1, 6, 11 minutes ago
      const submittedDate = new Date(Date.now() - minutesAgo * 60000);

      return {
        reviewId: ar.id, // Use mock ID
        submittedAt: submittedDate.toISOString(), // Use simulated date
        testerName: ar.testerName,
        storyTitle: ar.storyTitle, // Keep original title here
        storyId: ar.storyId,
        testerId: ar.testerId,
        source_key: mockStory?.source_key || `mock_source_${index}`, // Add placeholders
        epic_name: mockStory?.epic_name || `Mock Epic ${index + 1}`, // Add placeholders
      };
    });
  };


  // Fetch all data types
  const fetchAllData = async (mock: boolean) => {
    setLoadingAll(true);
    setLoadingStats(true);
    setLoadingRecent(true);
    setError(null);

    if (mock) {
      console.log("Setting transformed mock data for admin monitoring.");
      setUserStories(mockUserStories.map(s => ({ // Ensure mock stories have source/epic if needed by dropdowns
        id: s.id, title: s.title, source_key: s.source_key, epic_name: s.epic_name
      })));
      setPrinciples(mockPrinciples);
      setRecentReviews(transformMockRecentReviews()); // Use transformed mock recent reviews

      const { transformedPrincipleStats, transformedStoryStats } = transformMockStats();
      setPrincipleStats(transformedPrincipleStats);
      setStoryStats(transformedStoryStats);

      setLoadingAll(false);
      setLoadingStats(false);
      setLoadingRecent(false);
    } else {
      // Fetching real data logic remains the same
      console.log(`Fetching all real data for period: ${selectedPeriod}, story: ${selectedStory}, principle: ${selectedPrinciple}`);
      try {
        const [storiesRes, principlesRes, recentRes, principleStatsRes, storyStatsRes] = await Promise.all([
          fetch("/api/admin/stories"), fetch("/api/admin/principles"),
          fetch(`/api/admin/recent-reviews?period=${selectedPeriod}`),
          fetch(`/api/admin/stats/principles${selectedStory !== 'all' ? `?storyId=${selectedStory}` : ''}`),
          fetch(`/api/admin/stats/stories${selectedPrinciple !== 'all' ? `?principleId=${selectedPrinciple}` : ''}`),
        ]);
        if (!storiesRes.ok || !principlesRes.ok || !recentRes.ok || !principleStatsRes.ok || !storyStatsRes.ok) {
          const failed = [
            !storiesRes.ok && 'Stories', !principlesRes.ok && 'Principles', !recentRes.ok && 'Recent',
            !principleStatsRes.ok && 'P.Stats', !storyStatsRes.ok && 'S.Stats'
          ].filter(Boolean).join(', ');
          throw new Error(`Failed to fetch: ${failed}`);
        }
        const storiesData = await storiesRes.json(); const principlesData = await principlesRes.json();
        const recentData = await recentRes.json(); const principleStatsData = await principleStatsRes.json();
        const storyStatsData = await storyStatsRes.json();
        setUserStories(storiesData.data || []); setPrinciples(principlesData.data || []);
        setRecentReviews(recentData.data || []); setPrincipleStats(principleStatsData.data || []);
        setStoryStats(storyStatsData.data || []);
        console.log("Successfully fetched all real data.");
      } catch (err) {
        console.error("Error fetching all real data:", err);
        const errorMsg = err instanceof Error ? err.message : "Failed to fetch real-time data.";
        setError(errorMsg);
        setUserStories([]); setPrinciples([]); setRecentReviews([]); setPrincipleStats([]); setStoryStats([]);
      } finally {
        setLoadingAll(false); setLoadingStats(false); setLoadingRecent(false);
      }
    }
  };

  // Fetch only stats when story/principle filters change
  const fetchFilteredStats = async () => {
    if (useMockData) {
      console.log("Filtering local mock data based on dropdowns.");
      const { transformedPrincipleStats, transformedStoryStats } = transformMockStats();
      setPrincipleStats(transformedPrincipleStats);
      setStoryStats(transformedStoryStats);
      return;
    }
    // Fetch real filtered stats logic remains the same
    setLoadingStats(true); setError(null);
    console.log(`Fetching filtered stats for story: ${selectedStory}, principle: ${selectedPrinciple}`);
    try {
      const [principleStatsRes, storyStatsRes] = await Promise.all([
        fetch(`/api/admin/stats/principles${selectedStory !== 'all' ? `?storyId=${selectedStory}` : ''}`),
        fetch(`/api/admin/stats/stories${selectedPrinciple !== 'all' ? `?principleId=${selectedPrinciple}` : ''}`),
      ]);
      if (!principleStatsRes.ok || !storyStatsRes.ok) throw new Error("Failed to fetch filtered stats");
      const principleStatsData = await principleStatsRes.json(); const storyStatsData = await storyStatsRes.json();
      setPrincipleStats(principleStatsData.data || []); setStoryStats(storyStatsData.data || []);
      console.log("Successfully fetched filtered stats.");
    } catch (err) {
      console.error("Error fetching filtered stats:", err); setError("Failed to fetch filtered statistics.");
    } finally { setLoadingStats(false); }
  };

  // Fetch only recent reviews when period changes
  const fetchRecentReviewsByPeriod = async (period: string) => {
    if (useMockData) {
      setRecentReviews(transformMockRecentReviews()); // Use transformed mock data
      return;
    }
    // Fetch real recent reviews logic remains the same
    setLoadingRecent(true); setError(null);
    console.log(`Fetching recent reviews for period: ${period}`);
    try {
      const recentRes = await fetch(`/api/admin/recent-reviews?period=${period}`);
      if (!recentRes.ok) throw new Error("Failed to fetch recent reviews for period");
      const recentData = await recentRes.json();
      setRecentReviews(recentData.data || []);
      console.log(`Successfully fetched ${recentData.data?.length || 0} recent reviews.`);
    } catch (err) {
      console.error("Error fetching recent reviews:", err); setError("Failed to fetch recent reviews data.");
      setRecentReviews([]);
    } finally { setLoadingRecent(false); }
  };

  // --- useEffect Hooks ---
  useEffect(() => {
    fetchAllData(useMockData); // Initial fetch based on default useMockData=false
  }, []); // Run only once on mount

  useEffect(() => {
    // Handle mock data toggle change
    fetchAllData(useMockData);
  }, [useMockData]);

  useEffect(() => {
    // Refetch stats only when filters change *after* initial load
    if (!loadingAll) { fetchFilteredStats(); }
  }, [selectedStory, selectedPrinciple]);

  useEffect(() => {
    // Refetch recent reviews only when period changes *after* initial load
    if (!loadingAll) { fetchRecentReviewsByPeriod(selectedPeriod); }
  }, [selectedPeriod]);
  // ----------------------


  // --- Calculations for display ---
  const totalRecentReviewsCount = recentReviews.length;
  const reviewedStoryIds = new Set(storyStats.map(s => s.storyId));
  const totalCompletedReviewsCount = reviewedStoryIds.size;

  const overallRatings = {
    yes: principleStats.reduce((sum, stat) => sum + (stat.yesCount || 0), 0),
    partial: principleStats.reduce((sum, stat) => sum + (stat.partialCount || 0), 0),
    no: principleStats.reduce((sum, stat) => sum + (stat.noCount || 0), 0),
  };
  const overallPieData = [
    { name: "Yes", value: overallRatings.yes },
    { name: "Partially", value: overallRatings.partial },
    { name: "No", value: overallRatings.no },
  ].filter(d => d.value > 0);

  const filteredPrincipleStats = principleStats;
  const filteredStoryStats = storyStats;
  // ------------------------------


  return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col gap-6">
          {/* Header Section */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">Review Monitoring Dashboard</h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Switch id="mock-data" checked={useMockData} onCheckedChange={setUseMockData} aria-label="Toggle Mock Data" />
                <Label htmlFor="mock-data" className="text-sm">Use Mock Data</Label>
              </div>
              <Button onClick={() => fetchAllData(false)} disabled={loadingAll || useMockData} size="sm" variant="outline">
                {(loadingAll && !useMockData) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Refresh All Live Data
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}

          {/* Top Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Reviews submitted recently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center text-4xl font-bold min-h-[40px]">
                  {loadingRecent || loadingAll ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : totalRecentReviewsCount}
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-1 min-h-[24px]">
                  {/* Use short title for badges */}
                  {recentReviews.slice(0, 5).map((r) => {
                    const shortTitle = generateShortStatTitle(r);
                    return <Badge key={r.reviewId} variant="outline" className="text-xs" title={r.storyTitle}>{shortTitle}</Badge>
                  })}
                  {recentReviews.length > 5 && <Badge variant="secondary" className="text-xs">+{recentReviews.length-5} more</Badge>}
                  {recentReviews.length === 0 && !loadingRecent && !loadingAll && <p className="text-xs text-muted-foreground">No recent activity.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Completed Reviews Card */}
            <Card>
              <CardHeader className="pb-2"><CardTitle>Completed Reviews</CardTitle><CardDescription>Unique stories reviewed</CardDescription></CardHeader>
              <CardContent>
                <div className="flex items-center justify-center text-4xl font-bold min-h-[40px]">
                  {loadingAll || loadingStats ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : totalCompletedReviewsCount}
                </div>
                <div className="mt-4 h-[100px]">
                  {(loadingAll || loadingStats) ? <Skeleton className="h-full w-full" /> :
                      storyStats.length > 0 ? ( <BarChart data={storyStats.sort((a,b) => (b.totalReviews || 0) - (a.totalReviews || 0)).slice(0, 5).map(s => ({ name: generateShortStatTitle(s).substring(0, 20) + (generateShortStatTitle(s).length > 20 ? '...' : ''), value: s.totalReviews || 0 }))} index="name" categories={["Reviews"]} colors={["#3b82f6"]} valueFormatter={(v) => `${v}`} height={100} />)
                          : <p className="text-xs text-muted-foreground flex items-center justify-center h-full">No review data.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Overall Ratings Card */}
            <Card>
              <CardHeader className="pb-2"><CardTitle>Overall Ratings</CardTitle><CardDescription>Distribution across all principles</CardDescription></CardHeader>
              <CardContent className="flex justify-center items-center h-[140px]">
                {(loadingAll || loadingStats) ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> :
                    overallPieData.length > 0 ? (<PieChart data={overallPieData} index="name" categories={["value"]} colors={["#22c55e", "#f59e0b", "#ef4444"]} height={140} />)
                        : <p className="text-xs text-muted-foreground">No rating data.</p>}
              </CardContent>
            </Card>
          </div>

          {/* Lower Section Grid */}
          <div className="grid grid-cols-1 gap-6">
            {/* Recent Reviews Table Section */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                <h2 className="text-xl font-semibold">Recent Review Submissions</h2>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod} disabled={loadingRecent || useMockData}>
                  {/* ... Select options ... */}
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select Period" /></SelectTrigger>
                  <SelectContent><SelectItem value="5m">Last 5 mins</SelectItem><SelectItem value="30m">Last 30 mins</SelectItem><SelectItem value="1h">Last 1 hour</SelectItem><SelectItem value="3h">Last 3 hours</SelectItem><SelectItem value="6h">Last 6 hours</SelectItem><SelectItem value="24h">Last 24 hours</SelectItem><SelectItem value="all">All Time</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="min-h-[100px]">
                {/* MODIFIED: Pass data for short title generation */}
                {(loadingRecent || loadingAll) ? <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div> :
                    recentReviews.length === 0 ? <p className="text-muted-foreground text-sm p-4 border rounded-md text-center">No reviews submitted in this period.</p> :
                        <ActiveReviewsTable data={recentReviews.map(r => ({
                          id: r.reviewId,
                          testerId: r.testerId,
                          testerName: r.testerName,
                          storyId: r.storyId,
                          // Generate short title here if table doesn't do it
                          storyTitle: generateShortStatTitle(r), // Changed helper
                          fullStoryTitle: r.storyTitle, // Pass original title too
                          submittedAt: r.submittedAt,
                          // source_key: r.source_key, // Pass if table component needs it
                          // epic_name: r.epic_name,   // Pass if table component needs it
                        }))} />
                }
              </div>
            </div>

            {/* Statistics Section */}
            <div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <h2 className="text-xl font-semibold">Filtered Statistics</h2>
                <div className="flex flex-wrap gap-2">
                  {/* Story Filter Dropdown using Short Title */}
                  <Select value={selectedStory} onValueChange={setSelectedStory} disabled={loadingStats || useMockData || loadingAll}>
                    <SelectTrigger className="w-full md:w-[250px]"> <SelectValue placeholder="Filter by Story" /> </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stories</SelectItem>
                      {userStories?.map((story) => {
                        const shortDisplayTitle = generateShortStoryTitle(story); // Use correct helper
                        return ( <SelectItem key={story.id} value={String(story.id)} title={story.title}>{shortDisplayTitle}</SelectItem> );
                      })}
                    </SelectContent>
                  </Select>
                  {/* Principle Filter */}
                  <Select value={selectedPrinciple} onValueChange={setSelectedPrinciple} disabled={loadingStats || useMockData || loadingAll}>
                    <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Filter by Principle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Principles</SelectItem>
                      {principles?.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Statistics Tabs */}
              <Tabs defaultValue="principles" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="principles">Stats by Principle</TabsTrigger>
                  <TabsTrigger value="stories">Stats by Story</TabsTrigger>
                </TabsList>
                {/* Principle Stats Content */}
                <TabsContent value="principles" className="space-y-4 mt-4 min-h-[100px]">
                  {(loadingStats || loadingAll) ? <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div> :
                      filteredPrincipleStats.length === 0 ? <p className="text-muted-foreground text-sm text-center pt-4">No principle statistics match.</p> :
                          filteredPrincipleStats.map((stat) => <PrincipleStatisticsCard key={stat.id} data={stat} />)}
                </TabsContent>
                {/* Story Stats Content */}
                <TabsContent value="stories" className="space-y-4 mt-4 min-h-[100px]">
                  {(loadingStats || loadingAll) ? <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div> :
                      filteredStoryStats.length === 0 ? <p className="text-muted-foreground text-sm text-center pt-4">No story statistics match.</p> :
                          filteredStoryStats.map((stat) => <StoryStatisticsCard key={stat.id} data={stat} />)}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
  );
}