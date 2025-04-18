"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, ThumbsUp, ThumbsDown, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { type InvestPrinciple, type UserStory, type FeedbackData } from "@/lib/types"

const investPrinciples: InvestPrinciple[] = [
  {
    id: "independent",
    label: "Independent",
    description: "The story should be self-contained, without inherent dependencies on other stories.",
    question: "Can this story be developed, tested, and delivered on its own?",
  },
  {
    id: "negotiable",
    label: "Negotiable",
    description: "Stories are not contracts; leave space for discussion about details.",
    question: "Is the scope flexible enough to allow for negotiation?",
  },
  {
    id: "valuable",
    label: "Valuable",
    description: "It must deliver value to the end-user or customer.",
    question: "Is the benefit to the user clear and significant?",
  },
  {
    id: "estimable",
    label: "Estimable",
    description: "You must be able to estimate the size/effort required to implement the story.",
    question: "Can the team reasonably estimate the effort for this story?",
  },
  {
    id: "small",
    label: "Small",
    description: "Stories should be small enough to be completed within an iteration.",
    question: "Is the story small enough to be completed in one sprint/iteration?",
  },
  {
    id: "testable",
    label: "Testable",
    description: "The story must have defined acceptance criteria that can be tested.",
    question: "Are there clear acceptance criteria to confirm completion?",
  },
]

// Mock data to use as fallback when API fails
const mockUserStories: UserStory[] = [
  {
    id: 1,
    title: "User Login",
    description: "As a user, I want to log in using my email and password so that I can access my account.",
    acceptance_criteria: ["User can enter email and password", "System validates credentials", "User is redirected to dashboard on success"],
  },
  {
    id: 2,
    title: "View Dashboard",
    description: "As a logged-in user, I want to view my dashboard so that I can see an overview of my activities.",
    acceptance_criteria: ["Dashboard displays key metrics", "User information is visible"],
  },
  {
    id: 3,
    title: "User Story Submission",
    description: "As a product owner, I want to submit new user stories so that the team can review them.",
    acceptance_criteria: ["Form allows entering title and description", "Submission adds story to the backlog"],
  },
  {
    id: 4,
    title: "Review User Story (INVEST)",
    description: "As a team member, I want to review a user story against INVEST principles so that we ensure story quality.",
    acceptance_criteria: ["INVEST criteria are displayed", "User can rate each principle", "Feedback can be submitted"],
  },
  {
    id: 5,
    title: "Logout Functionality",
    description: "As a logged-in user, I want to log out so that I can securely end my session.",
    acceptance_criteria: ["Logout button is available", "Clicking logout ends the session", "User is redirected to login page"],
  },
]

export default function ReviewPage() {
  const router = useRouter()
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [currentPrincipleIndex, setCurrentPrincipleIndex] = useState(0)
  const [evaluations, setEvaluations] = useState<Record<string, string>>({})
  const [additionalFeedback, setAdditionalFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("story")

  // Fetch user stories from the API
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/stories", {
          // Add cache: 'no-store' to prevent caching issues
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`)
        }

        // Check if the response is JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response")
        }

        const data = await response.json()
        setUserStories(data.stories)
      } catch (err) {
        console.error("Error fetching stories:", err)
        setError("Failed to load stories from the server. Using sample stories instead.")
        // Use mock data as fallback
        setUserStories(mockUserStories)
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [])

  // If loading, show a loading indicator
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <h1 className="text-2xl font-bold">Loading User Stories...</h1>
        <div className="mt-4">
          <Progress value={50} className="h-2 w-full animate-pulse" />
        </div>
      </div>
    )
  }

  // If there are no stories (even after using mock data), show an error
  if (!userStories.length) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p>No stories available for review.</p>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">
          Return to Dashboard
        </Button>
      </div>
    )
  }

  const currentStory = userStories[currentStoryIndex]
  const totalStories = userStories.length
  const currentPrinciple = investPrinciples[currentPrincipleIndex]

  const handleEvaluationChange = (principleId: string, value: string) => {
    setEvaluations({
      ...evaluations,
      [principleId]: value,
    })

    // Automatically move to the next principle after selection
    if (currentPrincipleIndex < investPrinciples.length - 1) {
      setTimeout(() => {
        setCurrentPrincipleIndex(currentPrincipleIndex + 1)
      }, 300) // Small delay for better UX
    }
  }

  const isFormComplete = () => {
    return investPrinciples.every((principle) => evaluations[principle.id])
  }

  const completedPrinciples = investPrinciples.filter((principle) => evaluations[principle.id]).length
  const completionPercentage = (completedPrinciples / investPrinciples.length) * 100

  const handleNextPrinciple = () => {
    if (currentPrincipleIndex < investPrinciples.length - 1) {
      setCurrentPrincipleIndex(currentPrincipleIndex + 1)
    } else if (isFormComplete()) {
      setActiveTab("feedback")
    }
  }

  const handlePreviousPrinciple = () => {
    if (currentPrincipleIndex > 0) {
      setCurrentPrincipleIndex(currentPrincipleIndex - 1)
    } else {
      setActiveTab("story")
    }
  }

  // Function to retrieve user email from localStorage
  const getUserEmail = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userEmail")
    }
    return null
  }

  const handleSubmit = async () => {
    if (!isFormComplete()) return

    setIsSubmitting(true)

    try {
      // Get user email
      const userEmail = getUserEmail()
      if (!userEmail) {
        // Handle case where user email is not found (e.g., redirect to login)
        console.error("User email not found in localStorage. Redirecting to login.")
        router.push("/login")
        return
      }

      // Convert the evaluations format to match what our API expects
      const evaluationData: Record<string, string> = {}

      // Map each principle to its evaluation
      investPrinciples.forEach((principle) => {
        evaluationData[principle.label] = evaluations[principle.id] || ""
      })

      // Prepare feedback data including the correct email field name
      const feedbackData: FeedbackData = {
        storyId: currentStory.id,
        evaluations: evaluationData,
        additionalFeedback,
        email: userEmail, // Changed reviewerEmail to email
      }

      console.log("Submitting feedback with data:", feedbackData)

      try {
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(feedbackData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Error response:", errorData)
          throw new Error(errorData.details || "Failed to submit feedback")
        }

        const result = await response.json()
        console.log("Feedback submitted successfully:", result)
      } catch (submitError) {
        console.error("Error submitting feedback:", submitError)
        // Continue with the flow even if submission fails
      }

      // Reset form for next story
      setEvaluations({})
      setAdditionalFeedback("")
      setActiveTab("story")
      setCurrentPrincipleIndex(0)

      // Move to next story or finish
      if (currentStoryIndex < totalStories - 1) {
        setCurrentStoryIndex(currentStoryIndex + 1)
        setProgress(((currentStoryIndex + 1) / totalStories) * 100)
      } else {
        // All stories reviewed
        router.push("/review/complete")
      }
    } catch (error) {
      console.error("Error in submission process:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      {error && (
        <div className="mb-4 rounded-md bg-yellow-50 p-4 text-yellow-800">
          <div className="flex">
            <AlertCircle className="mr-2 h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Review User Story</h1>
          <span className="text-sm font-medium">
            Story {currentStoryIndex + 1} of {totalStories}
          </span>
        </div>
        <div className="mt-2">
          <Progress value={progress} className="h-2 w-full" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="story">Story</TabsTrigger>
          <TabsTrigger value="evaluate">Evaluate</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="story" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{currentStory.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 text-lg font-semibold">User Story:</h3>
                <div className="rounded-md bg-muted p-4">
                  <p className="text-lg">{currentStory.description}</p>
                </div>
              </div>

              {currentStory.acceptance_criteria && currentStory.acceptance_criteria.length > 0 && (
                <div>
                  <h3 className="mb-2 text-lg font-semibold">Acceptance Criteria:</h3>
                  <ul className="list-disc space-y-1 rounded-md bg-muted p-4 pl-10">
                    {currentStory.acceptance_criteria.map((criterion, index) => (
                      <li key={index} className="text-base">{criterion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => setActiveTab("evaluate")} className="w-full">
                Start Evaluation
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="evaluate" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>INVEST Principles</CardTitle>
                <span className="text-sm font-medium">
                  {currentPrincipleIndex + 1} of {investPrinciples.length}
                </span>
              </div>
              <CardDescription>Evaluate if this user story meets each of the INVEST principles</CardDescription>
              <Progress
                value={(currentPrincipleIndex / (investPrinciples.length - 1)) * 100}
                className="h-2 w-full mt-2"
              />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Independent</span>
                <span>Testable</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="w-full mb-6">
                  <h3 className="text-xl font-medium text-center mb-1">{currentPrinciple.label}</h3>
                  <p className="text-center text-muted-foreground mb-4">{currentPrinciple.description}</p>

                  <div className="bg-muted p-4 rounded-md mb-6">
                    <p className="text-center font-medium">{currentPrinciple.question}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={evaluations[currentPrinciple.id] === "yes" ? "default" : "outline"}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 h-24",
                        evaluations[currentPrinciple.id] === "yes" ? "bg-green-600 hover:bg-green-700" : "",
                      )}
                      onClick={() => handleEvaluationChange(currentPrinciple.id, "yes")}
                    >
                      <ThumbsUp className="h-8 w-8" />
                      <span>Yes</span>
                    </Button>

                    <Button
                      variant={evaluations[currentPrinciple.id] === "partial" ? "default" : "outline"}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 h-24",
                        evaluations[currentPrinciple.id] === "partial" ? "bg-amber-500 hover:bg-amber-600" : "",
                      )}
                      onClick={() => handleEvaluationChange(currentPrinciple.id, "partial")}
                    >
                      <HelpCircle className="h-8 w-8" />
                      <span>Partially</span>
                    </Button>

                    <Button
                      variant={evaluations[currentPrinciple.id] === "no" ? "default" : "outline"}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 h-24",
                        evaluations[currentPrinciple.id] === "no" ? "bg-red-600 hover:bg-red-700" : "",
                      )}
                      onClick={() => handleEvaluationChange(currentPrinciple.id, "no")}
                    >
                      <ThumbsDown className="h-8 w-8" />
                      <span>No</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousPrinciple}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                {currentPrincipleIndex === 0 ? "Back to Story" : "Previous"}
              </Button>

              {currentPrincipleIndex === investPrinciples.length - 1 ? (
                <Button
                  onClick={() => setActiveTab("feedback")}
                  disabled={!evaluations[currentPrinciple.id]}
                  className={!evaluations[currentPrinciple.id] ? "opacity-50 cursor-not-allowed" : ""}
                >
                  Continue to Feedback
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleNextPrinciple}
                  disabled={!evaluations[currentPrinciple.id]}
                  className={!evaluations[currentPrinciple.id] ? "opacity-50 cursor-not-allowed" : ""}
                >
                  Next Principle
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Principle indicators */}
          <div className="flex justify-center mt-4 gap-1">
            {investPrinciples.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  index === currentPrincipleIndex
                    ? "bg-primary scale-125"
                    : evaluations[investPrinciples[index].id]
                      ? "bg-green-500"
                      : "bg-gray-300",
                )}
                onClick={() => setCurrentPrincipleIndex(index)}
                aria-label={`Go to principle ${index + 1}`}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Additional Feedback</CardTitle>
              <CardDescription>
                Provide any additional comments or suggestions for improving this user story
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={additionalFeedback}
                onChange={(e) => setAdditionalFeedback(e.target.value)}
                placeholder="What would make this user story better? Any specific suggestions for improvement?"
                className="min-h-[150px]"
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("evaluate")}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Evaluation
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit & Continue"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
