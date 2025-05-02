"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Users, Medal } from "lucide-react";
import { ActiveReviewsTable } from "@/components/admin/active-reviews-table";
import { StoryStatisticsCard } from "@/components/admin/story-statistics-card";
import { PrincipleStatisticsCard } from "@/components/admin/principle-statistics-card";
import { mockUserStories, mockPrinciples, mockActiveReviews, mockPrincipleStats, mockStoryStats, mockTesterDistribution } from "@/lib/mock-data"; // Added mockTesterDistribution back
import { Skeleton } from "@/components/ui/skeleton";
import { generateShortStoryTitle, generateShortStatTitle } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// --- Interface Definitions ---
interface RecentReview { reviewId: number; submittedAt: string; testerName: string; storyTitle: string; storyId: number; testerId: number; source_key?: string | null; epic_name?: string | null; }
interface AdminStory { id: number; title: string; datasetName?: string; source_key?: string | null; epic_name?: string | null; }
interface AdminPrinciple { id: string; label: string; description?: string; }
interface AdminPrincipleStat { id: string; principleId: number; principleName: string; storyId: number | null; storyTitle: string | null; source_key?: string | null; epic_name?: string | null; yesCount: number; partialCount: number; noCount: number; totalReviews: number; }
interface AdminStoryStat { id: string; storyId: number; storyTitle: string | null; source_key?: string | null; epic_name?: string | null; principleIdNum: number | null; principleName: string | null; averageRating: number; totalReviews: number; meetsCriteria: number; principleId?: string; }
interface StoriesCoverageData { percentage: number; totalStories: number; storiesWithMultipleReviews: number; }
interface TesterDistributionData { testerId: number; testerName: string; reviewCount: number; }
// NEW: Interface for Submission Count
interface SubmissionCountData {
  count: number;
}

const principleStringToIdMap: { [key: string]: number } = { independent: 1, negotiable: 2, valuable: 3, estimable: 4, small: 5, testable: 6 };

// Mock data for submission count
const mockSubmissionCount: SubmissionCountData = { count: 78 };

export default function AdminMonitoringPage() {

  const [useMockData, setUseMockData] = useState(false);

  // --- Loading States ---
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingCoverage, setLoadingCoverage] = useState(true);
  const [loadingTesterDistribution, setLoadingTesterDistribution] = useState(true);
  const [loadingSubmissionCount, setLoadingSubmissionCount] = useState(true); // Added
  const [error, setError] = useState<string | null>(null);

  // --- Data States ---
  const [userStories, setUserStories] = useState<AdminStory[]>([]);
  const [principles, setPrinciples] = useState<AdminPrinciple[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [principleStats, setPrincipleStats] = useState<AdminPrincipleStat[]>([]);
  const [storyStats, setStoryStats] = useState<AdminStoryStat[]>([]);
  const [storiesReviewCoverage, setStoriesReviewCoverage] = useState<StoriesCoverageData>({ percentage: 0, totalStories: 0, storiesWithMultipleReviews: 0 });
  const [testerDistributionData, setTesterDistributionData] = useState<TesterDistributionData[]>([]);
  const [totalSubmissionCount, setTotalSubmissionCount] = useState<number>(0); // Added

  // --- Filters ---
  const [selectedStory, setSelectedStory] = useState<string>("all");
  const [selectedPrinciple, setSelectedPrinciple] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("1h");

  // --- Transform Mock Data ---
  // (Keep existing mock transformations)
  const transformMockStats = () => {
    const transformedPrincipleStats: AdminPrincipleStat[] = mockPrincipleStats
        .filter(stat => selectedStory === 'all' || stat.storyId === Number.parseInt(selectedStory))
        .map((stat, index) => {
          const mockStory = mockUserStories.find(s => s.id === stat.storyId);
          return {
            ...stat,
            id: `mock-principlestat-${stat.principleName}-${stat.storyId || 'all'}-${index}`,
            principleId: principleStringToIdMap[stat.principleId] ?? 0,
            source_key: mockStory?.source_key || null,
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
  const transformMockRecentReviews = () => {
    return mockActiveReviews.map((ar, index) => {
      const mockStory = mockUserStories.find(s => s.id === ar.storyId);
      const minutesAgo = (index * 5) + 1;
      const submittedDate = new Date(Date.now() - minutesAgo * 60000);
      return {
        reviewId: ar.id, submittedAt: submittedDate.toISOString(), testerName: ar.testerName,
        storyTitle: ar.storyTitle, storyId: ar.storyId, testerId: ar.testerId,
        source_key: mockStory?.source_key || `mock_source_${index}`, epic_name: mockStory?.epic_name || `Mock Epic ${index + 1}`,
      };
    });
  };

  // --- Fetch All Data ---
  const fetchAllData = async (mock: boolean) => {
    setLoadingAll(true); setLoadingStats(true); setLoadingRecent(true);
    setLoadingCoverage(true); setLoadingTesterDistribution(true); setLoadingSubmissionCount(true); // Added submission count
    setError(null);
    setStoriesReviewCoverage({ percentage: 0, totalStories: 0, storiesWithMultipleReviews: 0 });
    setTotalSubmissionCount(0); // Reset count

    if (mock) {
      console.log("Setting transformed mock data for admin monitoring.");
      setUserStories(mockUserStories.map(s => ({ id: s.id, title: s.title, source_key: s.source_key, epic_name: s.epic_name })));
      setPrinciples(mockPrinciples);
      setRecentReviews(transformMockRecentReviews());
      const { transformedPrincipleStats, transformedStoryStats } = transformMockStats();
      setPrincipleStats(transformedPrincipleStats); setStoryStats(transformedStoryStats);
      setStoriesReviewCoverage({ percentage: 66.7, totalStories: 3, storiesWithMultipleReviews: 2 });
      setTesterDistributionData(mockTesterDistribution);
      setTotalSubmissionCount(mockSubmissionCount.count); // Added mock count
      setLoadingAll(false); setLoadingStats(false); setLoadingRecent(false); setLoadingCoverage(false); setLoadingTesterDistribution(false); setLoadingSubmissionCount(false); // Added
    } else {
      console.log(`Fetching all real data for period: ${selectedPeriod}, story: ${selectedStory}, principle: ${selectedPrinciple}`);
      try {
        const [storiesRes, principlesRes, recentRes, principleStatsRes, storyStatsRes, coverageRes, distributionRes, submissionCountRes] = await Promise.all([ // Added submissionCountRes
          fetch("/api/admin/stories"),
          fetch("/api/admin/principles"),
          fetch(`/api/admin/recent-reviews?period=${selectedPeriod}`),
          fetch(`/api/admin/stats/principles${selectedStory !== 'all' ? `?storyId=${selectedStory}` : ''}`),
          fetch(`/api/admin/stats/stories${selectedPrinciple !== 'all' ? `?principleId=${selectedPrinciple}` : ''}`),
          fetch('/api/admin/stats/stories-review-coverage'),
          fetch('/api/admin/stats/tester-review-distribution'),
          fetch('/api/admin/stats/submission-count') // Added fetch
        ]);

        const responses = [storiesRes, principlesRes, recentRes, principleStatsRes, storyStatsRes, coverageRes, distributionRes, submissionCountRes]; // Added submissionCountRes
        const names = ['Stories', 'Principles', 'Recent', 'P.Stats', 'S.Stats', 'Coverage', 'Distribution', 'Submissions']; // Added Submissions
        const failed = responses.map((res, i) => !res.ok && names[i]).filter(Boolean).join(', ');

        if (failed) { throw new Error(`Failed to fetch: ${failed}`); }

        // Parse JSON responses
        const storiesData = await storiesRes.json(); const principlesData = await principlesRes.json();
        const recentData = await recentRes.json(); const principleStatsData = await principleStatsRes.json();
        const storyStatsData = await storyStatsRes.json(); const coverageData = await coverageRes.json();
        const distributionData = await distributionRes.json(); const submissionCountData = await submissionCountRes.json(); // Added

        console.log(">>> Coverage API Response:", coverageData);
        console.log(">>> Distribution API Response:", distributionData);
        console.log(">>> Submission Count Response:", submissionCountData); // Added log

        // Set states
        setUserStories(storiesData.data || []); setPrinciples(principlesData.data || []);
        setRecentReviews(recentData.data || []); setPrincipleStats(principleStatsData.data || []);
        setStoryStats(storyStatsData.data || []); setStoriesReviewCoverage(coverageData);
        setTesterDistributionData(distributionData.data || []);
        setTotalSubmissionCount(submissionCountData.data?.count || 0); // Added set state

        console.log("Successfully fetched all real data.");
      } catch (err) {
        console.error("Error fetching all real data:", err);
        const errorMsg = err instanceof Error ? err.message : "Failed to fetch real-time data.";
        setError(errorMsg);
        setUserStories([]); setPrinciples([]); setRecentReviews([]); setPrincipleStats([]); setStoryStats([]);
        setStoriesReviewCoverage({ percentage: 0, totalStories: 0, storiesWithMultipleReviews: 0 });
        setTesterDistributionData([]); setTotalSubmissionCount(0); // Added reset
      } finally {
        setLoadingAll(false); setLoadingStats(false); setLoadingRecent(false); setLoadingCoverage(false); setLoadingTesterDistribution(false); setLoadingSubmissionCount(false); // Added
      }
    }
  };

  // --- Fetch Filtered Stats (no changes needed here) ---
  const fetchFilteredStats = async () => {
    if (useMockData) {
      const { transformedPrincipleStats, transformedStoryStats } = transformMockStats();
      setPrincipleStats(transformedPrincipleStats); setStoryStats(transformedStoryStats);
      return;
    }
    setLoadingStats(true); setError(null);
    try {
      const [principleStatsRes, storyStatsRes] = await Promise.all([
        fetch(`/api/admin/stats/principles${selectedStory !== 'all' ? `?storyId=${selectedStory}` : ''}`),
        fetch(`/api/admin/stats/stories${selectedPrinciple !== 'all' ? `?principleId=${selectedPrinciple}` : ''}`),
      ]);
      if (!principleStatsRes.ok || !storyStatsRes.ok) throw new Error("Failed to fetch filtered stats");
      const principleStatsData = await principleStatsRes.json(); const storyStatsData = await storyStatsRes.json();
      setPrincipleStats(principleStatsData.data || []); setStoryStats(storyStatsData.data || []);
    } catch (err) { console.error("Error fetching filtered stats:", err); setError("Failed to fetch filtered statistics."); }
    finally { setLoadingStats(false); }
  };

  // --- Fetch Recent Reviews (no changes needed here) ---
  const fetchRecentReviewsByPeriod = async (period: string) => {
    if (useMockData) { setRecentReviews(transformMockRecentReviews()); return; }
    setLoadingRecent(true); setError(null);
    try {
      const recentRes = await fetch(`/api/admin/recent-reviews?period=${period}`);
      if (!recentRes.ok) throw new Error("Failed to fetch recent reviews for period");
      const recentData = await recentRes.json();
      setRecentReviews(recentData.data || []);
    } catch (err) { console.error("Error fetching recent reviews:", err); setError("Failed to fetch recent reviews data."); setRecentReviews([]); }
    finally { setLoadingRecent(false); }
  };

  // --- Use Effects (no changes needed here) ---
  useEffect(() => { fetchAllData(useMockData); }, []);
  useEffect(() => { fetchAllData(useMockData); }, [useMockData]);
  useEffect(() => { if (!loadingAll) { fetchFilteredStats(); } }, [selectedStory, selectedPrinciple]);
  useEffect(() => { if (!loadingAll) { fetchRecentReviewsByPeriod(selectedPeriod); } }, [selectedPeriod]);

  // --- Derived Data Calculations ---
  const totalRecentReviewsCount = recentReviews.length;
  const totalTesters = testerDistributionData.length;
  const topTesters = testerDistributionData.slice(0, 3);

  // --- Chart Data Preparation ---
  const filteredPrincipleStats = principleStats;
  const filteredStoryStats = storyStats;

  return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col gap-6">
          {/* Header and Refresh */}
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
          {error && ( <Alert variant="destructive"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Error</AlertTitle> <AlertDescription>{error}</AlertDescription> </Alert> )}

          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Recent Sessions Card */}
            <Card>
              <CardHeader className="pb-2"> <CardTitle>Recent Sessions</CardTitle> <CardDescription>Reviews submitted recently</CardDescription> </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center text-4xl font-bold min-h-[40px]"> {loadingRecent || loadingAll ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : totalRecentReviewsCount} </div>
                <div className="mt-2 flex flex-wrap justify-center gap-1 min-h-[24px]">
                  {Array.isArray(recentReviews) && recentReviews.slice(0, 5).map((r) => { const shortTitle = generateShortStatTitle(r); return <Badge key={r.reviewId} variant="outline" className="text-xs" title={r.storyTitle}>{shortTitle}</Badge> })}
                  {Array.isArray(recentReviews) && recentReviews.length > 5 && <Badge variant="secondary" className="text-xs">+{recentReviews.length-5} more</Badge>}
                  {Array.isArray(recentReviews) && recentReviews.length === 0 && !loadingRecent && !loadingAll && <p className="text-xs text-muted-foreground">No recent activity.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Story Review Coverage Card */}
            <Card>
              <CardHeader className="pb-2"> <CardTitle>Story Review Coverage</CardTitle> <CardDescription>% of stories with {">"}=1 review</CardDescription> </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center text-4xl font-bold min-h-[40px]"> {loadingAll || loadingCoverage ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : `${storiesReviewCoverage.percentage}%`} </div>
                <div className="mt-2 text-center text-xs text-muted-foreground min-h-[16px]"> {!(loadingAll || loadingCoverage) && `${storiesReviewCoverage.storiesWithMultipleReviews} of ${storiesReviewCoverage.totalStories} stories >=1 review`} </div>
                <div className="mt-2 h-2"> {loadingAll || loadingCoverage ? <Skeleton className="h-2 w-full" /> : <Progress value={storiesReviewCoverage.percentage} className="h-2" />} </div>
              </CardContent>
            </Card>

            {/* Tester Leaderboard Card */}
            <Card>
              <CardHeader className="pb-2"> <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" />Tester Leaderboard</CardTitle> <CardDescription>Top reviewers (Active Dataset)</CardDescription> </CardHeader>
              <CardContent>
                <div className="min-h-[60px]">
                  {(loadingAll || loadingTesterDistribution || loadingSubmissionCount) ? ( // Check submission count loading too
                      <div className="space-y-2"> <Skeleton className="h-4 w-3/4"/> <Skeleton className="h-4 w-1/2"/> <Skeleton className="h-4 w-2/3"/> </div>
                  ) : testerDistributionData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center pt-4">No reviews submitted yet.</p>
                  ) : (
                      <ul className="space-y-1">
                        {topTesters.map((tester, index) => {
                          const percentage = totalSubmissionCount > 0 ? ((tester.reviewCount / totalSubmissionCount) * 100).toFixed(1) : 0;
                          return (
                              <li key={tester.testerId} className="flex items-center justify-between text-sm">
                             <span className="flex items-center font-medium">
                               {index === 0 && <Medal className="mr-1.5 h-4 w-4 text-yellow-500" />}
                               {index === 1 && <Medal className="mr-1.5 h-4 w-4 text-gray-400" />}
                               {index === 2 && <Medal className="mr-1.5 h-4 w-4 text-orange-400" />}
                               {index > 2 && <span className="mr-1.5 h-4 w-4"></span>}
                               {tester.testerName}
                             </span>
                                {/* Updated Badge to show count and percentage */}
                                <Badge variant="secondary" title={`${percentage}% of total reviews`}>{tester.reviewCount} ({percentage}%)</Badge>
                              </li>
                          );
                        })}
                      </ul>
                  )}
                </div>
                <div className="mt-3 text-center text-xs text-muted-foreground">
                  {!(loadingAll || loadingTesterDistribution) && totalTesters > 0 && (
                      totalTesters <= topTesters.length
                          ? `Showing all ${totalTesters} reviewer(s)`
                          : `Top ${topTesters.length} contribute ${topTesters.reduce((sum, t) => sum + t.reviewCount, 0)} of ${totalSubmissionCount} reviews` // Show raw count contribution
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 gap-6">
            {/* Recent Review Submissions Section */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                <h2 className="text-xl font-semibold">Recent Review Submissions</h2>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod} disabled={loadingRecent || useMockData}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select Period" /></SelectTrigger>
                  <SelectContent><SelectItem value="5m">Last 5 mins</SelectItem><SelectItem value="30m">Last 30 mins</SelectItem><SelectItem value="1h">Last 1 hour</SelectItem><SelectItem value="3h">Last 3 hours</SelectItem><SelectItem value="6h">Last 6 hours</SelectItem><SelectItem value="24h">Last 24 hours</SelectItem><SelectItem value="all">All Time</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="min-h-[100px]">
                {(loadingRecent || loadingAll) ? <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div> :
                    !Array.isArray(recentReviews) || recentReviews.length === 0 ? <p className="text-muted-foreground text-sm p-4 border rounded-md text-center">No reviews submitted in this period.</p> :
                        <ActiveReviewsTable data={recentReviews.map(r => ({
                          id: r.reviewId, testerId: r.testerId, testerName: r.testerName, storyId: r.storyId,
                          storyTitle: generateShortStatTitle(r), fullStoryTitle: r.storyTitle, submittedAt: r.submittedAt,
                        }))} />
                }
              </div>
            </div>

            {/* Filtered Statistics Section */}
            <div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <h2 className="text-xl font-semibold">Filtered Statistics</h2>
                <div className="flex flex-wrap gap-2">
                  {/* Story Filter */}
                  <Select value={selectedStory} onValueChange={setSelectedStory} disabled={loadingStats || useMockData || loadingAll}>
                    <SelectTrigger className="w-full md:w-[250px]"> <SelectValue placeholder="Filter by Story" /> </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stories</SelectItem>
                      {Array.isArray(userStories) && userStories?.map((story) => { const shortDisplayTitle = generateShortStoryTitle(story); return ( <SelectItem key={story.id} value={String(story.id)} title={story.title}>{shortDisplayTitle}</SelectItem> ); })}
                    </SelectContent>
                  </Select>
                  {/* Principle Filter */}
                  <Select value={selectedPrinciple} onValueChange={setSelectedPrinciple} disabled={loadingStats || useMockData || loadingAll}>
                    <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Filter by Principle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Principles</SelectItem>
                      {Array.isArray(principles) && principles?.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Tabs for Principles/Stories Stats */}
              <Tabs defaultValue="principles" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="principles">Stats by Principle</TabsTrigger>
                  <TabsTrigger value="stories">Stats by Story</TabsTrigger>
                </TabsList>
                {/* Principles Tab Content */}
                <TabsContent value="principles" className="space-y-4 mt-4 min-h-[100px]">
                  {(loadingStats || loadingAll) ? <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div> :
                      !Array.isArray(filteredPrincipleStats) || filteredPrincipleStats.length === 0 ? <p className="text-muted-foreground text-sm text-center pt-4">No principle statistics match.</p> :
                          filteredPrincipleStats.map((stat) => <PrincipleStatisticsCard key={stat.id} data={stat} />)}
                </TabsContent>
                {/* Stories Tab Content */}
                <TabsContent value="stories" className="space-y-4 mt-4 min-h-[100px]">
                  {(loadingStats || loadingAll) ? <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div> :
                      !Array.isArray(filteredStoryStats) || filteredStoryStats.length === 0 ? <p className="text-muted-foreground text-sm text-center pt-4">No story statistics match.</p> :
                          filteredStoryStats.map((stat) => <StoryStatisticsCard key={stat.id} data={stat} />)}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
  );
}