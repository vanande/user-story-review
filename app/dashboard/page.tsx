"use client"

import {useEffect, useState} from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {LogOut} from "lucide-react";



export default function DashboardPage() {
  const router = useRouter()
  const [reviewsCompleted, setReviewsCompleted] = useState(0)
  const [pendingReviews, setPendingReviews] = useState(5)
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) {
      const namePart = email.split('@')[0];
      setUserName(namePart);
    } else {
      console.warn("User email not found in localStorage on dashboard.");
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("userEmail"); // Clear stored email
    router.push("/login"); // Redirect to login page
  };
  return (
    <div className="container mx-auto max-w-5xl p-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {userName ? `Hello, ${userName}!` : "Tester Dashboard"}
        </h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Review Statistics</CardTitle>
            <CardDescription>Your contribution to improving the language model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Reviews Completed</span>
                <span className="text-sm font-bold">{reviewsCompleted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pending Reviews</span>
                <span className="text-sm font-bold">{pendingReviews}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Start New Review</CardTitle>
            <CardDescription>Evaluate user stories against INVEST principles</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <p className="mb-4 text-center text-sm text-muted-foreground">
              You will be presented with one user story at a time to evaluate against the INVEST principles.
            </p>
            <Button size="lg" onClick={() => router.push("/review")} className="w-full">
              Start Review
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>INVEST Principles Reference</CardTitle>
            <CardDescription>A quick reminder of what each principle means</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 text-sm">
              <li>
                <strong>Independent:</strong> The story should be self-contained and not dependent on other stories.
              </li>
              <li>
                <strong>Negotiable:</strong> Details can be discussed and refined between stakeholders.
              </li>
              <li>
                <strong>Valuable:</strong> The story delivers value to stakeholders.
              </li>
              <li>
                <strong>Estimable:</strong> The size of the story can be estimated with reasonable accuracy.
              </li>
              <li>
                <strong>Small:</strong> The story is small enough to be completed in one sprint.
              </li>
              <li>
                <strong>Testable:</strong> The story can be tested to verify it meets requirements.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
