"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {AlertCircle, ThumbsUp, ThumbsDown, HelpCircle, ChevronLeft, ChevronRight, Info} from "lucide-react"
import { cn } from "@/lib/utils"
import { type InvestPrinciple, type UserStory, type FeedbackData } from "@/lib/types"
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";

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
  const router = useRouter();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentPrincipleIndex, setCurrentPrincipleIndex] = useState(0);
  const [evaluations, setEvaluations] = useState<Record<string, string>>({});
  const [additionalFeedback, setAdditionalFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("story");

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors
        // Fetch stories from API
        const response = await fetch("/api/stories", { cache: "no-store" });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Received non-JSON response from server");
        }
        const data = await response.json();
        if (!data.success || !Array.isArray(data.stories) || data.stories.length === 0) {
          throw new Error("No valid stories received from API.");
        }
        setUserStories(data.stories);
        setProgress(0); // Reset progress for new set of stories
        setCurrentStoryIndex(0); // Start from the first story
        setCurrentPrincipleIndex(0); // Start from the first principle
        setEvaluations({}); // Clear previous evaluations
        setAdditionalFeedback("");
        setActiveTab("story"); // Go to story tab
      } catch (err) {
        console.error("Error fetching stories:", err);
        setError("Failed to load stories. Please try refreshing. Using sample stories as fallback.");
        // Use mock data as fallback only if API fails critically
        if(userStories.length === 0) { // Avoid overwriting if mocks are already there from previous error
          setUserStories(mockUserStories);
          setProgress(0);
          setCurrentStoryIndex(0);
          setCurrentPrincipleIndex(0);
          setEvaluations({});
          setAdditionalFeedback("");
          setActiveTab("story");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []); // Empty dependency array ensures this runs once on mount

  // --- Loading and Error States ---
  if (loading) {
    return (
        <div className="container mx-auto max-w-4xl p-4 text-center">
          <h1 className="text-xl font-semibold mb-4">Loading User Story...</h1>
          <Progress value={undefined} className="h-2 w-1/2 mx-auto animate-pulse" />
        </div>
    );
  }

  if (error && userStories.length === 0) { // Show error only if loading failed AND no fallback data
    return (
        <div className="container mx-auto max-w-4xl p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Stories</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Refresh Page
          </Button>
        </div>
    );
  }

  if (!userStories || userStories.length === 0) {
    // This case should ideally be covered by the error state after fetch attempt
    return (
        <div className="container mx-auto max-w-4xl p-4">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p>No stories available for review.</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
    );
  }
  // -----------------------------


  const currentStory = userStories[currentStoryIndex];
  const totalStories = userStories.length;
  const currentPrinciple = investPrinciples[currentPrincipleIndex];

  // ... handleEvaluationChange, isFormComplete, calculation methods (unchanged) ...
  const handleEvaluationChange = (principleId: string, value: string) => {
    setEvaluations((prev) => ({ ...prev, [principleId]: value }));
    // Auto-advance if not the last principle
    if (currentPrincipleIndex < investPrinciples.length - 1) {
      setTimeout(() => {
        setCurrentPrincipleIndex(currentPrincipleIndex + 1);
      }, 200); // Shorter delay
    } else {
      // Maybe auto-advance to feedback tab if last principle is selected?
      // setTimeout(() => {
      //    if (isFormComplete()) setActiveTab("feedback");
      // }, 300);
    }
  };

  const isFormComplete = () => {
    return investPrinciples.every((principle) => evaluations[principle.id]);
  };

  const completedPrinciplesCount = investPrinciples.filter((principle) => evaluations[principle.id]).length;
  const principleCompletionPercentage = (completedPrinciplesCount / investPrinciples.length) * 100;

  // ... handleNextPrinciple, handlePreviousPrinciple (unchanged) ...
  const handleNextPrinciple = () => {
    if (currentPrincipleIndex < investPrinciples.length - 1) {
      setCurrentPrincipleIndex(currentPrincipleIndex + 1);
    } else if (isFormComplete()) {
      setActiveTab("feedback");
    }
  };

  const handlePreviousPrinciple = () => {
    if (currentPrincipleIndex > 0) {
      setCurrentPrincipleIndex(currentPrincipleIndex - 1);
    } else {
      setActiveTab("story"); // Go back to story tab if on first principle
    }
  };

  // ... getUserEmail, handleSubmit (unchanged) ...
  const getUserEmail = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userEmail");
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!isFormComplete()) {
      console.warn("Attempted to submit incomplete form.");
      // Optionally show a toast or message
      return;
    }

    setIsSubmitting(true);
    setError(null); // Clear previous submission errors

    try {
      const userEmail = getUserEmail();
      if (!userEmail) {
        console.error("User email not found for submission.");
        setError("User email not found. Please log in again.");
        // Consider redirecting: router.push("/login");
        setIsSubmitting(false);
        return;
      }

      const evaluationData: Record<string, string> = {};
      investPrinciples.forEach((principle) => {
        evaluationData[principle.label] = evaluations[principle.id] || "";
      });

      const feedbackData: FeedbackData = {
        storyId: currentStory.id,
        evaluations: evaluationData,
        additionalFeedback,
        email: userEmail,
      };

      console.log("Submitting feedback with data:", feedbackData);

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        let errorDetails = "Failed to submit feedback";
        try {
          const errorData = await response.json();
          errorDetails = errorData.details || errorData.error || errorDetails;
        } catch (parseErr) {
          errorDetails = `Server responded with ${response.status}: ${response.statusText}`;
        }
        console.error("Error response:", errorDetails);
        throw new Error(errorDetails);
      }

      const result = await response.json();
      console.log("Feedback submitted successfully:", result);

      // Reset form for next story or finish
      setEvaluations({});
      setAdditionalFeedback("");
      setActiveTab("story");
      setCurrentPrincipleIndex(0);

      if (currentStoryIndex < totalStories - 1) {
        setCurrentStoryIndex(currentStoryIndex + 1);
        // Update overall progress (percentage of stories completed)
        setProgress(((currentStoryIndex + 1) / totalStories) * 100);
      } else {
        router.push("/review/complete");
      }
    } catch (error) {
      console.error("Error in submission process:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred during submission.");
      // Display error to user (e.g., using a toast)
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* Progress header (unchanged) */}
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
          <TabsTrigger value="story">Story Details</TabsTrigger> {/* Renamed */}
          <TabsTrigger value="evaluate">Evaluate Principles</TabsTrigger> {/* Renamed */}
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        {/* Story Tab Content (Unchanged structure, content comes from currentStory) */}
        <TabsContent value="story" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{currentStory.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 text-lg font-semibold">User Story:</h3>
                <div className="rounded-md bg-muted p-4">
                  {/* Description might be long, add max height and scroll */}
                  <p className="text-base max-h-40 overflow-y-auto">{currentStory.description}</p>
                </div>
              </div>

              {currentStory.acceptance_criteria && currentStory.acceptance_criteria.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">Acceptance Criteria:</h3>
                    <ul className="list-disc space-y-1 rounded-md bg-muted p-4 pl-8 max-h-60 overflow-y-auto"> {/* Added max-h/scroll */}
                      {currentStory.acceptance_criteria.map((criterion, index) => (
                          <li key={index} className="text-sm">{criterion}</li> // Slightly smaller text
                      ))}
                    </ul>
                  </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => setActiveTab("evaluate")} className="w-full">
                Start Evaluation <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* --- MODIFIED: Evaluate Tab Content --- */}
        <TabsContent value="evaluate" className="mt-4">
          {/* ADDED: Story Context Section */}
          <Card className="mb-6 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Info className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                Story Under Review
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p><strong>Title:</strong> {currentStory.title}</p>
              <div>
                <p className="font-semibold mb-1">Description:</p>
                <p className="pl-2 text-muted-foreground max-h-20 overflow-y-auto">{currentStory.description}</p>
              </div>
              {currentStory.acceptance_criteria && currentStory.acceptance_criteria.length > 0 && (
                  <div>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1" className="border-none">
                        <AccordionTrigger className="font-semibold pt-0 pb-1 hover:no-underline">Acceptance Criteria ({currentStory.acceptance_criteria.length})</AccordionTrigger>
                        <AccordionContent>
                          <ul className="list-disc space-y-1 pl-6 text-xs text-muted-foreground max-h-32 overflow-y-auto">
                            {currentStory.acceptance_criteria.map((criterion, index) => (
                                <li key={index}>{criterion}</li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
              )}
            </CardContent>
          </Card>
          {/* End of Added Story Context Section */}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>INVEST Principles</CardTitle>
                <span className="text-sm font-medium text-muted-foreground">
                        {currentPrincipleIndex + 1} / {investPrinciples.length}
                        </span>
              </div>
              <CardDescription>Evaluate if this user story meets the principle:</CardDescription>
              {/* Progress within principles */}
              <Progress
                  value={principleCompletionPercentage}
                  className="h-1.5 w-full mt-3"
              />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>{investPrinciples[0].label}</span>
                <span>{investPrinciples[investPrinciples.length - 1].label}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="w-full mb-6 text-center"> {/* Centered content */}
                  <h3 className="text-xl font-semibold mb-1">{currentPrinciple.label}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{currentPrinciple.description}</p>

                  <div className="bg-muted p-4 rounded-md mb-6">
                    <p className="text-center font-medium">{currentPrinciple.question}</p>
                  </div>

                  {/* Evaluation Buttons (Unchanged structure) */}
                  <div className="grid grid-cols-3 gap-4">
                    <Button /* Yes */
                        variant={evaluations[currentPrinciple.id] === "yes" ? "default" : "outline"}
                        className={cn("... ", evaluations[currentPrinciple.id] === "yes" ? "bg-green-600 hover:bg-green-700" : "")}
                        onClick={() => handleEvaluationChange(currentPrinciple.id, "yes")}
                    > <ThumbsUp className="h-6 w-6 mb-1" /> Yes </Button>
                    <Button /* Partial */
                        variant={evaluations[currentPrinciple.id] === "partial" ? "default" : "outline"}
                        className={cn("... ", evaluations[currentPrinciple.id] === "partial" ? "bg-amber-500 hover:bg-amber-600" : "")}
                        onClick={() => handleEvaluationChange(currentPrinciple.id, "partial")}
                    > <HelpCircle className="h-6 w-6 mb-1" /> Partially </Button>
                    <Button /* No */
                        variant={evaluations[currentPrinciple.id] === "no" ? "default" : "outline"}
                        className={cn("... ", evaluations[currentPrinciple.id] === "no" ? "bg-red-600 hover:bg-red-700" : "")}
                        onClick={() => handleEvaluationChange(currentPrinciple.id, "no")}
                    > <ThumbsDown className="h-6 w-6 mb-1" /> No </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousPrinciple} disabled={isSubmitting}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                {currentPrincipleIndex === 0 ? "Story Details" : "Previous"}
              </Button>
              {currentPrincipleIndex === investPrinciples.length - 1 ? (
                  <Button onClick={() => setActiveTab("feedback")} disabled={!evaluations[currentPrinciple.id] || isSubmitting}>
                    Continue to Feedback <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
              ) : (
                  <Button onClick={handleNextPrinciple} disabled={!evaluations[currentPrinciple.id] || isSubmitting}>
                    Next Principle <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
              )}
            </CardFooter>
          </Card>

          <div className="flex justify-center mt-4 gap-1.5">
            {investPrinciples.map((p, index) => (
                <button
                    key={p.id}
                    className={cn(
                        "w-2.5 h-2.5 rounded-full transition-all duration-200 ease-in-out", // Base style
                        index === currentPrincipleIndex ? "bg-primary scale-125 ring-2 ring-primary/30" : // Active style
                            evaluations[p.id] ? "bg-green-500" : // Completed style
                                "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500", // Default style
                        "disabled:opacity-50"
                    )}
                    onClick={() => setCurrentPrincipleIndex(index)}
                    aria-label={`Go to principle ${p.label}`}
                    disabled={isSubmitting}
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
  );
}