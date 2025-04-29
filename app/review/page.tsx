// app/review/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {AlertCircle, ThumbsUp, ThumbsDown, HelpCircle, ChevronLeft, ChevronRight, Info, Loader2} from "lucide-react";
import {cn, generateShortStoryTitle} from "@/lib/utils";
import { type InvestPrinciple, type UserStory, type FeedbackData } from "@/lib/types"; // Ensure UserStory includes source_key, epic_name
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading state

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
];

// Mock data (optional, keep for fallback testing if desired)
const mockUserStories: UserStory[] = [
  { id: 101, source_key: "mock", epic_name: "Mock Epic 1", title: "Mock User Login", description: "As a mock user...", acceptance_criteria: ["ac1", "ac2"], independent: true, negotiable: true, valuable: true, estimable: true, small: true, testable: true },
  { id: 102, source_key: "mock", epic_name: "Mock Epic 2", title: "Mock View Dashboard", description: "As a mock logged-in user...", acceptance_criteria: ["ac3"], independent: true, negotiable: false, valuable: true, estimable: false, small: true, testable: true },
  // Add more mock stories if needed
];


export default function ReviewPage() {
  const router = useRouter();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentPrincipleIndex, setCurrentPrincipleIndex] = useState(0);
  const [evaluations, setEvaluations] = useState<Record<string, string>>({});
  const [additionalFeedback, setAdditionalFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userStories, setUserStories] = useState<UserStory[]>([]); // Use UserStory type from lib/types
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // For fetch or submission errors
  const [activeTab, setActiveTab] = useState("story");

  // --- useEffect for fetching stories ---
  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      try {
        const response = await fetch("/api/stories", { cache: "no-store" });
        if (!response.ok) throw new Error(`Server error fetching stories: ${response.status}`);
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Received non-JSON response fetching stories");
        }
        const data = await response.json();
        if (!data.success || !Array.isArray(data.stories) || data.stories.length === 0) {
          console.warn("API failed to return valid stories, attempting fallback.");
          if (mockUserStories && mockUserStories.length > 0) {
            setUserStories(mockUserStories);
            setError("Loaded fallback sample stories as the server data was unavailable."); // Inform user
          } else {
            throw new Error("No valid stories received from API and no mock data available.");
          }
        } else {
          setUserStories(data.stories);
        }
        // Reset state for new batch
        setProgress(0);
        setCurrentStoryIndex(0);
        setCurrentPrincipleIndex(0);
        setEvaluations({});
        setAdditionalFeedback("");
        setActiveTab("story");
      } catch (err) {
        console.error("Error fetching stories:", err);
        const errorMsg = err instanceof Error ? err.message : "Failed to load stories.";
        setError(errorMsg);
        // Use mock data on critical fetch error only if available and no stories loaded yet
        if (userStories.length === 0 && mockUserStories && mockUserStories.length > 0) {
          console.warn("Using mock stories due to fetch error.");
          setUserStories(mockUserStories);
          // Reset state as well
          setProgress(0); setCurrentStoryIndex(0); setCurrentPrincipleIndex(0); setEvaluations({}); setAdditionalFeedback(""); setActiveTab("story");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []); // Run only on mount

  // --- Loading and Error States ---
  if (loading) {
    return (
        <div className="container mx-auto max-w-4xl p-4 text-center">
          <h1 className="text-xl font-semibold mb-4">Loading User Story...</h1>
          {/* Use Skeletons for a better loading UI */}
          <Card className="mb-6">
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-4 w-1/4 mb-2 mt-4" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
            <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
          </Card>
        </div>
    );
  }

  // Show critical error only if loading failed AND we have no stories (not even mocks)
  if (error && (!userStories || userStories.length === 0)) {
    return (
        <div className="container mx-auto max-w-4xl p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Stories</AlertTitle>
            <AlertDescription>{error || "Could not load stories for review."}</AlertDescription>
          </Alert>
          <div className="mt-4 space-x-2">
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Go to Dashboard
            </Button>
          </div>
        </div>
    );
  }

  // Handle case where stories array is empty after loading (API returned empty, no mocks)
  if (!userStories || userStories.length === 0) {
    return (
        <div className="container mx-auto max-w-4xl p-4">
          <Alert>
            <AlertCircle className="h-4 w-4"/>
            <AlertTitle>No Stories Available</AlertTitle>
            <AlertDescription>
              There are currently no user stories available for review in the active dataset. Please check back later or contact an administrator.
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
    );
  }
  // ----------------------------------------------------

  // Ensure current indexes are valid
  const safeStoryIndex = Math.min(currentStoryIndex, userStories.length - 1);
  const currentStory = userStories[safeStoryIndex];
  const totalStories = userStories.length;
  const currentPrinciple = investPrinciples[currentPrincipleIndex];
  const shortTitle = generateShortStoryTitle(currentStory); // Use helper
  // -----------------------------

  // --- Event Handlers ---
  const handleEvaluationChange = (principleId: string, value: string) => {
    setEvaluations((prev) => ({ ...prev, [principleId]: value }));
    if (currentPrincipleIndex < investPrinciples.length - 1) {
      setTimeout(() => setCurrentPrincipleIndex(currentPrincipleIndex + 1), 200);
    }
  };
  const isFormComplete = () => investPrinciples.every((p) => evaluations[p.id]);
  const completedPrinciplesCount = investPrinciples.filter((p) => evaluations[p.id]).length;
  const principleCompletionPercentage = (completedPrinciplesCount / investPrinciples.length) * 100;

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

  const getUserEmail = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userEmail");
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!isFormComplete()) {
      console.warn("Attempted to submit incomplete form.");
      setError("Please evaluate all INVEST principles before submitting."); // Show user error
      return;
    }

    setIsSubmitting(true);
    setError(null); // Clear previous submission errors

    try {
      const userEmail = getUserEmail();
      if (!userEmail) {
        throw new Error("User email not found. Please log in again.");
      }

      const evaluationData: Record<string, string> = {};
      investPrinciples.forEach((principle) => {
        evaluationData[principle.label] = evaluations[principle.id] || ""; // Use label as key for DB
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
        let errorDetails = `Server error: ${response.status}`;
        try { const errorData = await response.json(); errorDetails = errorData.details || errorData.error || errorDetails;}
        catch (parseErr) { /* Ignore parsing error, stick with status */ }
        throw new Error(errorDetails);
      }

      const result = await response.json();
      console.log("Feedback submitted successfully:", result);

      // Reset form for next story or finish
      setEvaluations({});
      setAdditionalFeedback("");
      setActiveTab("story");
      setCurrentPrincipleIndex(0);

      if (safeStoryIndex < totalStories - 1) {
        setCurrentStoryIndex(safeStoryIndex + 1);
        setProgress(((safeStoryIndex + 1) / totalStories) * 100);
      } else {
        router.push("/review/complete"); // All stories reviewed
      }
    } catch (error) {
      console.error("Error in submission process:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };
  // --------------------


  return (
      <div className="container mx-auto max-w-4xl p-4">
        {/* Submission Error Display */}
        {error && !loading && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Notice</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {/* Progress header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Review User Story</h1>
            <span className="text-sm font-medium">
                Story {safeStoryIndex + 1} of {totalStories}
            </span>
          </div>
          <div className="mt-2">
            <Progress value={progress} className="h-2 w-full" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="story">Story Details</TabsTrigger>
            <TabsTrigger value="evaluate">Evaluate Principles</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          {/* Story Details Tab */}
          <TabsContent value="story" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{currentStory.title || "User Story Title Not Available"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 text-lg font-semibold">User Story Description:</h3>
                  <div className="rounded-md bg-muted p-4">
                    <p className="text-base max-h-60 overflow-y-auto">{currentStory.description || "No description available."}</p>
                  </div>
                </div>
                {currentStory.acceptance_criteria && currentStory.acceptance_criteria.length > 0 ? (
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">Acceptance Criteria:</h3>
                      <ul className="list-disc space-y-1 rounded-md bg-muted p-4 pl-8 max-h-60 overflow-y-auto">
                        {currentStory.acceptance_criteria.map((criterion, index) => (
                            <li key={index} className="text-sm">{criterion}</li>
                        ))}
                      </ul>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground italic mt-4">No acceptance criteria provided.</p>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={() => setActiveTab("evaluate")} className="w-full" disabled={isSubmitting}>
                  Start Evaluation <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Evaluate Tab */}
          <TabsContent value="evaluate" className="mt-4">
            {/* Story Context Section */}
            <Card className="mb-6 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Info className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Story Under Review: {shortTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div>
                  <p className="font-semibold mb-1">Full Description:</p>
                  <p className="pl-2 text-muted-foreground max-h-20 overflow-y-auto">{currentStory.description}</p>
                </div>
                {currentStory.acceptance_criteria && currentStory.acceptance_criteria.length > 0 ? (
                    <div>
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1" className="border-none">
                          <AccordionTrigger className="font-semibold text-sm pt-0 pb-1 hover:no-underline">Acceptance Criteria ({currentStory.acceptance_criteria.length})</AccordionTrigger>
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
                ) : (
                    <p className="text-xs text-muted-foreground italic">No acceptance criteria provided.</p>
                )}
              </CardContent>
            </Card>
            {/* End Story Context Section */}

            {/* Principle Evaluation Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>INVEST Principles</CardTitle>
                  <span className="text-sm font-medium text-muted-foreground">
                           {currentPrincipleIndex + 1} / {investPrinciples.length}
                    </span>
                </div>
                <CardDescription>Evaluate if this user story meets the principle:</CardDescription>
                <Progress value={principleCompletionPercentage} className="h-1.5 w-full mt-3" />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{investPrinciples[0].label}</span>
                  <span>{investPrinciples[investPrinciples.length - 1].label}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="w-full mb-6 text-center">
                    <h3 className="text-xl font-semibold mb-1">{currentPrinciple.label}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{currentPrinciple.description}</p>
                    <div className="bg-muted p-4 rounded-md mb-6">
                      <p className="text-center font-medium">{currentPrinciple.question}</p>
                    </div>
                    {/* Buttons */}
                    <div className="grid grid-cols-3 gap-4">
                      <Button variant={evaluations[currentPrinciple.id] === "yes" ? "default" : "outline"} className={cn("flex flex-col items-center justify-center gap-1 h-20 md:h-24 text-xs md:text-sm", evaluations[currentPrinciple.id] === "yes" ? "bg-green-600 hover:bg-green-700 text-white" : "")} onClick={() => handleEvaluationChange(currentPrinciple.id, "yes")} disabled={isSubmitting}> <ThumbsUp className="h-5 w-5 md:h-6 md:w-6 mb-1" /> Yes </Button>
                      <Button variant={evaluations[currentPrinciple.id] === "partial" ? "default" : "outline"} className={cn("flex flex-col items-center justify-center gap-1 h-20 md:h-24 text-xs md:text-sm", evaluations[currentPrinciple.id] === "partial" ? "bg-amber-500 hover:bg-amber-600 text-white" : "")} onClick={() => handleEvaluationChange(currentPrinciple.id, "partial")} disabled={isSubmitting}> <HelpCircle className="h-5 w-5 md:h-6 md:w-6 mb-1" /> Partially </Button>
                      <Button variant={evaluations[currentPrinciple.id] === "no" ? "default" : "outline"} className={cn("flex flex-col items-center justify-center gap-1 h-20 md:h-24 text-xs md:text-sm", evaluations[currentPrinciple.id] === "no" ? "bg-red-600 hover:bg-red-700 text-white" : "")} onClick={() => handleEvaluationChange(currentPrinciple.id, "no")} disabled={isSubmitting}> <ThumbsDown className="h-5 w-5 md:h-6 md:w-6 mb-1" /> No </Button>
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

            {/* Principle indicators */}
            <div className="flex justify-center mt-4 gap-1.5">
              {investPrinciples.map((p, index) => (
                  <button
                      key={p.id}
                      className={cn(
                          "w-2.5 h-2.5 rounded-full transition-all duration-200 ease-in-out",
                          index === currentPrincipleIndex ? "bg-primary scale-125 ring-2 ring-primary/30" :
                              evaluations[p.id] ? "bg-green-500" :
                                  "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500",
                          "disabled:opacity-50"
                      )}
                      onClick={() => setCurrentPrincipleIndex(index)}
                      aria-label={`Go to principle ${p.label}`}
                      disabled={isSubmitting}
                  />
              ))}
            </div>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Additional Feedback</CardTitle>
                <CardDescription>
                  Provide any additional comments or suggestions for improving this user story.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                    value={additionalFeedback}
                    onChange={(e) => setAdditionalFeedback(e.target.value)}
                    placeholder="What would make this user story better? Any specific suggestions for improvement?"
                    className="min-h-[150px]"
                    disabled={isSubmitting}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("evaluate")} disabled={isSubmitting}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back to Evaluation
                </Button>
                <Button onClick={handleSubmit} disabled={!isFormComplete() || isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit & Continue"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}