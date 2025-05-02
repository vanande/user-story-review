// File: app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, RefreshCcw, AlertCircle, Users, Medal, UserCog } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- Interfaces ---
interface DashboardStats { completed: number; total: number; left: number; }
// Updated Interface
interface TesterDistributionData {
  testerId: number;
  testerEmail: string; // Added email
  testerName: string; // Keep name for display
  reviewCount: number;
}

const ADMIN_EMAILS = ["v.khatchatrian@groupeonepoint.com", "m.ortega@groupeonepoint.com", "h.imhah@groupeonepoint.com"];

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [leaderboardData, setLeaderboardData] = useState<TesterDistributionData[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
      const namePart = email.split('@')[0];
      setUserName(namePart);
      if (ADMIN_EMAILS.includes(email.toLowerCase())) {
        setIsAdmin(true);
      }
    } else {
      console.warn("User email not found in localStorage on dashboard.");
      router.push('/login');
    }
  }, [router]);

  const fetchData = async (email: string) => {
    // ...(fetch logic remains the same)...
    setLoadingStats(true);
    setLoadingLeaderboard(true);
    setStatsError(null);
    setLeaderboardError(null);
    console.log(`Fetching dashboard data for ${email}...`);

    try {
      const [statsResponse, leaderboardResponse] = await Promise.all([
        fetch(`/api/dashboard/stats?email=${encodeURIComponent(email)}`),
        fetch(`/api/admin/stats/tester-review-distribution`) // Fetch overall leaderboard data
      ]);

      // --- Process User Stats ---
      if (!statsResponse.ok) {
        let errorMsg = `Failed to fetch stats: ${statsResponse.statusText}`;
        try { const errData = await statsResponse.json(); errorMsg = errData.error || errData.details || errorMsg; } catch (e) { throw new Error("Failed to parse stats response : " + e); }
        throw new Error(errorMsg);
      }
      const statsResult = await statsResponse.json();
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
        console.log("Dashboard stats fetched:", statsResult.data);
      } else {
        throw new Error(statsResult.error || "Failed to get valid stats data from API");
      }

      // --- Process Leaderboard Stats ---
      if (!leaderboardResponse.ok) {
        let errorMsg = `Failed to fetch leaderboard: ${leaderboardResponse.statusText}`;
        try { const errData = await leaderboardResponse.json(); errorMsg = errData.error || errData.details || errorMsg; } catch (e) { throw new Error("Failed to parse leaderboard response : " + e); }
        throw new Error(errorMsg);
      }
      const leaderboardResult = await leaderboardResponse.json();
      if (leaderboardResult.success && Array.isArray(leaderboardResult.data)) {
        setLeaderboardData(leaderboardResult.data);
        console.log("Leaderboard data fetched:", leaderboardResult.data);
      } else {
        throw new Error(leaderboardResult.error || "Failed to get valid leaderboard data from API");
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      const errorMsg = error instanceof Error ? error.message : "Could not load dashboard data.";
      if (errorMsg.includes("stats")) {
        setStatsError(errorMsg);
        setStats(null);
      } else if (errorMsg.includes("leaderboard")) {
        setLeaderboardError(errorMsg);
        setLeaderboardData([]);
      } else {
        setStatsError(errorMsg);
        setLeaderboardError(errorMsg);
        setStats(null);
        setLeaderboardData([]);
      }

    } finally {
      setLoadingStats(false);
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchData(userEmail);
    }
  }, [userEmail]);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    router.push("/login");
  };

  // --- Leaderboard Calculations (Updated) ---
  const topTesters = leaderboardData.slice(0, 5);
  // Find index using testerEmail now
  const loggedInUserIndex = leaderboardData.findIndex(t => t.testerEmail?.toLowerCase() === userEmail?.toLowerCase());
  const loggedInUserStats = loggedInUserIndex !== -1 ? leaderboardData[loggedInUserIndex] : null;
  const loggedInUserRank = loggedInUserIndex !== -1 ? loggedInUserIndex + 1 : null;

  return (
      <div className="container mx-auto max-w-5xl p-4">
        {/* Header */}
        <div className="container mx-auto max-w-5xl p-4">
          {/* --- Header --- */}
          <div className="mb-8 flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-3xl font-bold">
              {userName ? `Hello, ${userName}!` : "Tester Dashboard"}
            </h1>
            <div className="flex items-center space-x-2">
              {/* Refresh Button */}
              <Button variant="outline" size="sm" onClick={() => userEmail && fetchData(userEmail)} disabled={loadingStats || loadingLeaderboard || !userEmail}>
                <RefreshCcw className={`mr-2 h-4 w-4 ${(loadingStats || loadingLeaderboard) ? 'animate-spin' : ''}`} /> Refresh
              </Button>

              {/* Admin Area Button (Conditional & FIXED) */}
              {isAdmin && (
                  <Button variant="outline" size="sm" asChild className="justify-start">
                    <Link href="/admin">
                      {/* Wrap Link content in a single span */}
                      <span className="flex items-center">
                            <UserCog className="mr-2 h-4 w-4" /> Admin Area
                        </span>
                    </Link>
                  </Button>
              )}

              {/* Logout Button */}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Review Statistics Card */}
          <Card>
            <CardHeader> <CardTitle>Your Review Statistics</CardTitle> <CardDescription>Your progress on the current dataset</CardDescription> </CardHeader>
            <CardContent>
              {statsError && ( <Alert variant="destructive" className="mb-4"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Error Loading Your Stats</AlertTitle> <AlertDescription>{statsError}</AlertDescription> </Alert> )}
              <div className="grid gap-2">
                {/* User Rank Display */}
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="font-medium">Your Rank:</span>
                  {loadingLeaderboard ? <Skeleton className="h-5 w-12" /> :
                      loggedInUserRank ? ( <span className="font-bold">#{loggedInUserRank} <span className="text-xs text-muted-foreground">({loggedInUserStats?.reviewCount} reviews)</span></span> ) : (
                          <span className="italic text-muted-foreground">No reviews yet</span>
                      )}
                </div>
                <hr className="my-1"/>
                {/* Other Stats */}
                <div className="flex items-center justify-between"> <span className="text-sm font-medium">Reviews Completed</span> {loadingStats ? <Skeleton className="h-5 w-10" /> : <span className="text-sm font-bold">{stats?.completed ?? 0}</span>} </div>
                <div className="flex items-center justify-between"> <span className="text-sm font-medium">Reviews Left</span> {loadingStats ? <Skeleton className="h-5 w-10" /> : <span className="text-sm font-bold">{stats?.left ?? '?'}</span>} </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1"> <span className="italic">Total in Dataset</span> {loadingStats ? <Skeleton className="h-4 w-8" /> : <span className="italic">{stats?.total ?? '?'}</span>} </div>
              </div>
            </CardContent>
          </Card>

          {/* Start New Review Card */}
          <Card>
            <CardHeader> <CardTitle>Start New Review</CardTitle> <CardDescription>Evaluate user stories against INVEST principles</CardDescription> </CardHeader>
            <CardContent className="flex flex-col items-center">
              {loadingLeaderboard ? <Skeleton className="h-6 w-3/4 mb-4"/> : ( loggedInUserRank === null && ( <p className="mb-4 text-center text-sm text-green-700 dark:text-green-400 font-medium"> Start reviewing stories to get on the leaderboard! </p> ) )}
              <p className="mb-4 text-center text-sm text-muted-foreground"> You will be presented with one user story at a time from the active dataset. </p>
              <Button size="lg" onClick={() => router.push("/review")} className="w-full" disabled={loadingStats || (stats !== null && stats.left === 0)}> {loadingStats ? "Loading..." : (stats !== null && stats.left === 0) ? "All Stories Reviewed!" : "Start Review"} </Button>
            </CardContent>
          </Card>

          {/* Tester Leaderboard Card */}
          <Card>
            <CardHeader> <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" />Leaderboard</CardTitle> <CardDescription>Top reviewers (Active Dataset)</CardDescription> </CardHeader>
            <CardContent>
              {leaderboardError && ( <Alert variant="destructive" className="mb-4"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Error Loading Leaderboard</AlertTitle> <AlertDescription>{leaderboardError}</AlertDescription> </Alert> )}
              <div className="min-h-[90px]">
                {loadingLeaderboard ? ( <div className="space-y-2"> <Skeleton className="h-4 w-3/4"/> <Skeleton className="h-4 w-1/2"/> <Skeleton className="h-4 w-2/3"/> <Skeleton className="h-4 w-5/6"/> <Skeleton className="h-4 w-1/2"/> </div>
                ) : leaderboardData.length === 0 ? ( <p className="text-sm text-muted-foreground text-center pt-4">No reviews submitted yet.</p>
                ) : (
                    <ul className="space-y-1">
                      {topTesters.map((tester, index) => (
                          // Updated comparison for highlighting
                          <li key={tester.testerId} className={cn( "flex items-center justify-between text-sm p-1 rounded", tester.testerEmail?.toLowerCase() === userEmail?.toLowerCase() ? "bg-blue-100 dark:bg-blue-900/50" : "" )}>
                                <span className="flex items-center font-medium truncate">
                                    {index === 0 && <Medal className="mr-1.5 h-4 w-4 text-yellow-500 flex-shrink-0" />}
                                  {index === 1 && <Medal className="mr-1.5 h-4 w-4 text-gray-400 flex-shrink-0" />}
                                  {index === 2 && <Medal className="mr-1.5 h-4 w-4 text-orange-400 flex-shrink-0" />}
                                  {index > 2 && <span className="ml-1.5 mr-1.5 h-4 w-4 inline-block flex-shrink-0 text-center">{(index + 1)}.</span>}
                                  {/* Display testerName (which might be name or email) */}
                                  <span className="truncate" title={tester.testerName}>{tester.testerName.split('@')[0]}</span>
                                </span>
                            <Badge variant="secondary">{tester.reviewCount}</Badge>
                          </li>
                      ))}
                      {loggedInUserStats && loggedInUserRank && loggedInUserRank > 5 && (
                          <>
                            <li className="text-center text-muted-foreground text-xs my-1">...</li>
                            <li className={cn( "flex items-center justify-between text-sm p-1 rounded", "bg-blue-100 dark:bg-blue-900/50" )}>
                                        <span className="flex items-center font-medium truncate">
                                            <span className="ml-1.5 mr-1.5 h-4 w-4 inline-block flex-shrink-0 text-center">{loggedInUserRank}.</span>
                                            <span className="truncate" title={loggedInUserStats.testerName}>{loggedInUserStats.testerName.split('@')[0]}</span>
                                        </span>
                              <Badge variant="secondary">{loggedInUserStats.reviewCount}</Badge>
                            </li>
                          </>
                      )}
                    </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* INVEST Principles Reference Card */}
        <div className="mt-8"> <Card> <CardHeader> <CardTitle>INVEST Principles Reference</CardTitle> <CardDescription>A quick reminder of what each principle means</CardDescription> </CardHeader> <CardContent> <ul className="grid gap-3 text-sm"> <li><strong>Independent:</strong> The story should be self-contained...</li> <li><strong>Negotiable:</strong> Details can be discussed...</li> <li><strong>Valuable:</strong> The story delivers value...</li> <li><strong>Estimable:</strong> The size of the story can be estimated...</li> <li><strong>Small:</strong> The story is small enough...</li> <li><strong>Testable:</strong> The story can be tested...</li> </ul> </CardContent> </Card> </div>
      </div>
  );
}