// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react"; // Import useEffect
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, RefreshCcw, AlertCircle } from "lucide-react"; // Import icons
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert

// Define the interface for the stats data
interface DashboardStats {
  completed: number;
  total: number;
  left: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  // --- ADDED BACK: State variables for stats ---
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true); // Start loading true
  const [statsError, setStatsError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null); // Store email for fetching
  // -------------------------------------------

  // Get user email and derive name on mount
  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email); // Store email for fetching stats
      const namePart = email.split('@')[0];
      // Capitalize first letter
      const derivedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      setUserName(derivedName);
    } else {
      console.warn("User email not found in localStorage on dashboard.");
      router.push('/login'); // Force redirect if no email
    }
  }, [router]);

  // --- ADDED BACK: fetchStats function ---
  const fetchStats = async (email: string) => {
    setLoadingStats(true);
    setStatsError(null);
    console.log(`Fetching dashboard stats for ${email}...`);
    try {
      const response = await fetch(`/api/dashboard/stats?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        let errorMsg = `Failed to fetch stats: ${response.statusText}`;
        try {
          const errData = await response.json();
          errorMsg = errData.error || errData.details || errorMsg;
        } catch (e) { /* Ignore json parsing error */ }
        throw new Error(errorMsg);
      }
      const result = await response.json();
      if (result.success && result.data) {
        setStats(result.data);
        console.log("Dashboard stats fetched:", result.data);
      } else {
        throw new Error(result.error || "Failed to get valid stats data from API");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setStatsError(error instanceof Error ? error.message : "Could not load statistics.");
      setStats(null); // Clear potentially stale stats on error
    } finally {
      setLoadingStats(false);
    }
  };
  // ------------------------------------

  // --- ADDED BACK: useEffect to call fetchStats ---
  useEffect(() => {
    if (userEmail) { // Only fetch if email is available
      fetchStats(userEmail);
    }
    // Intentionally only runs when userEmail is first set
  }, [userEmail]);
  // ----------------------------------------------


  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    router.push("/login");
  };

  return (
      <div className="container mx-auto max-w-5xl p-4">
        {/* Header with Greeting and Logout */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {userName ? `Hello, ${userName}!` : "Tester Dashboard"}
          </h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Review Statistics Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Review Statistics</CardTitle>
                {/* Refresh button calls fetchStats again */}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => userEmail && fetchStats(userEmail)} disabled={loadingStats || !userEmail}>
                  <RefreshCcw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <CardDescription>Your progress on the current dataset</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Error Display */}
              {statsError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Stats</AlertTitle>
                    <AlertDescription>{statsError}</AlertDescription>
                  </Alert>
              )}
              <div className="grid gap-2">
                {/* Reviews Completed Display */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Reviews Completed</span>
                  {loadingStats ? <Skeleton className="h-5 w-10" /> :
                      <span className="text-sm font-bold">{stats?.completed ?? 0}</span>}
                </div>
                {/* Reviews Left Display */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Reviews Left</span>
                  {loadingStats ? <Skeleton className="h-5 w-10" /> :
                      <span className="text-sm font-bold">{stats?.left ?? '?'}</span>}
                </div>
                {/* Total Display */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span className="italic">Total in Dataset</span>
                  {loadingStats ? <Skeleton className="h-4 w-8" /> :
                      <span className="italic">{stats?.total ?? '?'}</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Start New Review Card */}
          <Card>
            <CardHeader>
              <CardTitle>Start New Review</CardTitle>
              <CardDescription>Evaluate user stories against INVEST principles</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <p className="mb-4 text-center text-sm text-muted-foreground">
                You will be presented with one user story at a time from the active dataset.
              </p>
              {/* Disable button if loading or no reviews left */}
              <Button
                  size="lg"
                  onClick={() => router.push("/review")}
                  className="w-full"
                  disabled={loadingStats || (stats !== null && stats.left === 0)}
              >
                {loadingStats ? "Loading..." : (stats !== null && stats.left === 0) ? "All Stories Reviewed!" : "Start Review"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* INVEST Principles Reference */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>INVEST Principles Reference</CardTitle>
              <CardDescription>A quick reminder of what each principle means</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 text-sm">
                <li><strong>Independent:</strong> The story should be self-contained...</li>
                <li><strong>Negotiable:</strong> Details can be discussed...</li>
                <li><strong>Valuable:</strong> The story delivers value...</li>
                <li><strong>Estimable:</strong> The size of the story can be estimated...</li>
                <li><strong>Small:</strong> The story is small enough...</li>
                <li><strong>Testable:</strong> The story can be tested...</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}