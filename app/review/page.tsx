"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
} from "lucide-react";
import { cn, generateShortStoryTitle, generateFullStoryTitle } from "@/lib/utils";
import { type InvestPrinciple, type UserStory, type FeedbackData } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const investPrinciples: InvestPrinciple[] = [
  {
    id: "independent",
    label: "Indépendant",
    description:
      "Chaque user story doit pouvoir exister par elle-même. Elle devrait idéalement pouvoir être développée et testée indépendamment des autres. Cette autonomie permet plus de flexibilité dans la planification et la priorisation des tâches, facilitant une réponse agile aux changements",
    question: "Est-ce que cette user story peut être développée sans dépendre de la complétion d'une autre user story spécifique ?",
  },
  {
    id: "negotiable",
    label: "Négociable",
    description: "Une user story n'est pas un contrat figé, mais un point de départ pour la conversation. Elle est flexible et ouverte aux ajustements basés sur les insights de l'équipe et l'évolution des besoins.",
    question: "Est-ce que cette user story est suffisamment flexible pour permettre à l'équipe de discuter et d'affiner les détails de la solution pendant le développement ?",
  },
  {
    id: "valuable",
    label: "Valuable",
    description: "L'essence d'une user story est la valeur qu'elle apporte à l'utilisateur final, elle doit être orientée utilisateur. Chaque user story doit contribuer de manière significative à la satisfaction des besoins utilisateurs et à l'amélioration de leur appréciation du produit.",
    question: "Est-ce que cette user story apporte une valeur tangible et identifiable à l'utilisateur final ou à un stakeholder ?",
  },
  {
    id: "estimable",
    label: "Estimable",
    description: "La user story peut être estimée sans nécessairement l'être lors de sa création initiale, par exemple lors d'une session de Planning Poker. Les user stories trop grandes sont plus difficiles à estimer.",
    question: "L'équipe Agile est-elle en mesure de fournir une estimation raisonnable (même approximative) de l'effort nécessaire pour réaliser cette user story ?",
  },
  {
    id: "small",
    label: "Petite",
    description: "Pour maintenir l'élan et assurer une livraison continue, les user stories doivent être d'une taille suffisamment restreintepour être complétées au cours d'un seul sprint. Une bonne règle générale est qu\'une seule user story ne devrait pas prendre plus de 50 % d\'une itération (par exemple, pas plus de 5 jours pour un sprint de 2 semaines).",
    question: "Cette user story est-elle suffisamment petite pour être raisonnablement complétée au cours d\'un seul sprint ?",
  },
  {
    id: "testable",
    label: "Testable",
    description: "Un aspect clé d\'une user story est sa capacité à être testée. Il doit y avoir des critères clairs pour vérifier que les objectifs de cette dernière ont été atteints et qu\'elle répond aux besoins définis de l\'utilisateur. Une description et des critères d'acceptation clairs sans termes ambigus sont généralement un bon indicateur de la testabilité de la user story.",
    question: "Est-il possible de rédiger les cas de teste pour la user story en se basant sur les informations contenues dans la description et les critères d'acceptation ?",
  },
];

const mockUserStories: UserStory[] = [
  {
    id: 101,
    source_key: "mock",
    epic_name: "Mock Epic 1",
    title: "Mock User Login",
    description: "As a mock user...",
    acceptance_criteria: ["ac1", "ac2"],
    independent: true,
    negotiable: true,
    valuable: true,
    estimable: true,
    small: true,
    testable: true,
  },
  {
    id: 102,
    source_key: "mock",
    epic_name: "Mock Epic 2",
    title: "Mock View Dashboard",
    description: "As a mock logged-in user...",
    acceptance_criteria: ["ac3"],
    independent: true,
    negotiable: false,
    valuable: true,
    estimable: false,
    small: true,
    testable: true,
  },
];

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
      setLoading(true);
      setError(null);
      try {
        // Get user email from localStorage
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
          throw new Error('User email not found. Please log in again.');
        }

        const response = await fetch(`/api/stories?testerId=${encodeURIComponent(userEmail)}`, { cache: "no-store" });
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
            setError("Loaded fallback sample stories as the server data was unavailable.");
          } else {
            throw new Error("No valid stories received from API and no mock data available.");
          }
        } else {
          setUserStories(data.stories);
        }

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

        if (userStories.length === 0 && mockUserStories && mockUserStories.length > 0) {
          console.warn("Using mock stories due to fetch error.");
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
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-4 text-center">
        <h1 className="text-xl font-semibold mb-4">Chargement de la user story...</h1>
        {/* Use Skeletons for a better loading UI */}
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-1/4 mb-2" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-1/4 mb-2 mt-4" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error && (!userStories || userStories.length === 0)) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur lors du chargement des stories</AlertTitle>
          <AlertDescription>{error || "Impossible de charger les stories à annoter."}</AlertDescription>
        </Alert>
        <div className="mt-4 space-x-2">
          <Button onClick={() => window.location.reload()}>Rafraîchir la page</Button>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            Aller au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  if (!userStories || userStories.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aucune story disponible</AlertTitle>
          <AlertDescription>
            Il n'y a actuellement aucune user story à annoter dans le jeu de données actif. Merci de réessayer plus tard ou de contacter un administrateur.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">
          Retour au tableau de bord
        </Button>
      </div>
    );
  }

  const safeStoryIndex = Math.min(currentStoryIndex, userStories.length - 1);
  const currentStory = userStories[safeStoryIndex];
  const totalStories = userStories.length;
  const currentPrinciple = investPrinciples[currentPrincipleIndex];
  const shortTitle = generateShortStoryTitle(currentStory);
  const fullStoryDisplayTitle = generateFullStoryTitle(currentStory);

  const storiesInSameEpic = userStories.filter((story) => {
    if (story.id === currentStory.id) {
      return false; // Exclude the current story itself
    }

    // Check if currentStory has a valid, non-empty epicId
    const currentStoryHasEpicId = currentStory.epicId && typeof currentStory.epicId === 'string' && currentStory.epicId.trim() !== "";

    if (currentStoryHasEpicId) {
      // Scenario 1: currentStory has epicId. Match other stories by epicId.
      // The other story must also have a valid, non-empty epicId that matches.
      const storyHasEpicId = story.epicId && typeof story.epicId === 'string' && story.epicId.trim() !== "";
      return storyHasEpicId && story.epicId === currentStory.epicId;
    } else {
      // Scenario 2: currentStory does NOT have a valid epicId. Match by epic_name AND source_key.
      const currentEpicName = currentStory.epic_name?.trim().toLowerCase() || "";
      const storyEpicName = story.epic_name?.trim().toLowerCase() || "";

      const currentSourceKey = currentStory.source_key?.trim().toLowerCase() || "";
      const storySourceKey = story.source_key?.trim().toLowerCase() || "";

      return storyEpicName === currentEpicName && storySourceKey === currentSourceKey;
    }
  });

  const handleEvaluationChange = (principleId: string, value: string) => {
    setEvaluations((prev) => ({ ...prev, [principleId]: value }));
    if (currentPrincipleIndex < investPrinciples.length - 1) {
      setTimeout(() => setCurrentPrincipleIndex(currentPrincipleIndex + 1), 200);
    }
  };
  const isFormComplete = () => investPrinciples.every((p) => evaluations[p.id]);
  const completedPrinciplesCount = investPrinciples.filter((p) => evaluations[p.id]).length;
  const principleCompletionPercentage = (completedPrinciplesCount / investPrinciples.length) * 100;
  const currentPrincipleVisualPercentage = ((currentPrincipleIndex + 1) / investPrinciples.length) * 100;

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
      setActiveTab("story");
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
      setError("Please evaluate all INVEST principles before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const userEmail = getUserEmail();
      if (!userEmail) {
        throw new Error("User email not found. Please log in again.");
      }

      const evaluationData: Record<string, string> = {};
      investPrinciples.forEach((principle) => {
        evaluationData[principle.id] = evaluations[principle.id] || "";
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
        try {
          const errorData = await response.json();
          errorDetails = errorData.details || errorData.error || errorDetails;
        } catch (parseErr) {
          /* Ignore parsing error, stick with status */
        }
        throw new Error(errorDetails);
      }

      const result = await response.json();
      console.log("Feedback submitted successfully:", result);

      setEvaluations({});
      setAdditionalFeedback("");
      setActiveTab("story");
      setCurrentPrincipleIndex(0);

      if (safeStoryIndex >= totalStories - 1) {
        router.push("/review/complete");
        return;
      }

      setCurrentStoryIndex(safeStoryIndex + 1);
      setProgress(((safeStoryIndex + 1) / totalStories) * 100);
    } catch (error) {
      console.error("Error in submission process:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred during submission."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold mr-4">
            Annotation : {fullStoryDisplayTitle}
          </h1>
          <span className="text-sm font-medium whitespace-nowrap">
            Story {safeStoryIndex + 1} sur {totalStories}
          </span>
        </div>
        <div className="mt-2">
          <Progress value={((safeStoryIndex + 1) / totalStories) * 100} className="h-1.5 w-full mt-3" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="story">Détails de la story</TabsTrigger>
          <TabsTrigger value="evaluate">Évaluer les principes</TabsTrigger>
          <TabsTrigger value="feedback">Retour</TabsTrigger>
        </TabsList>

        {/* Story Details Tab */}
        <TabsContent value="story" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{shortTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 text-lg font-semibold">Description de la user story :</h3>
                <div className="rounded-md bg-muted p-4">
                  <p className="text-base max-h-60 overflow-y-auto">
                    {currentStory.description || "Aucune description disponible."}
                  </p>
                </div>
              </div>
              {currentStory.acceptance_criteria && currentStory.acceptance_criteria.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-lg font-semibold">Critères d'acceptation :</h3>
                  <ul className="list-disc space-y-1 rounded-md bg-muted p-4 pl-8 max-h-60 overflow-y-auto">
                    {currentStory.acceptance_criteria.map((criterion, index) => (
                      <li key={index} className="text-sm">
                        {criterion}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic mt-4">
                  Aucun critère d'acceptation fourni.
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => setActiveTab("evaluate")}
                className="w-full"
                disabled={isSubmitting}
              >
                Commencer l'évaluation <ChevronRight className="ml-1 h-4 w-4" />
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
                Story en cours d'annotation : {fullStoryDisplayTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div>
                <p className="font-semibold mb-1">Description complète :</p>
                <p className="pl-2 text-muted-foreground max-h-20 overflow-y-auto">
                  {currentStory.description}
                </p>
              </div>
              {currentStory.acceptance_criteria && currentStory.acceptance_criteria.length > 0 ? (
                <div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="border-none">
                      <AccordionTrigger className="font-semibold text-sm pt-0 pb-1 hover:no-underline">
                        Critères d'acceptation ({currentStory.acceptance_criteria.length})
                      </AccordionTrigger>
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
                <p className="text-xs text-muted-foreground italic">
                  Aucun critère d'acceptation fourni.
                </p>
              )}
            </CardContent>
          </Card>
          {/* End Story Context Section */}

          {/* Principle Evaluation Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Principes INVEST</CardTitle>
                <span className="text-sm font-medium text-muted-foreground">
                  {currentPrincipleIndex + 1} / {investPrinciples.length}
                </span>
              </div>
              <CardDescription>Évaluez si cette user story respecte le principe suivant :</CardDescription>
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
                  <p className="text-sm text-muted-foreground mb-4">
                    {currentPrinciple.description}
                  </p>
                  <div className="bg-muted p-4 rounded-md mb-6">
                    <p className="text-center font-medium">{currentPrinciple.question}</p>
                  </div>

                  {/* Conditionally add Accordion for 'Independent' principle */}
                  {currentPrinciple.id === "independent" && storiesInSameEpic.length > 0 && (
                    <div className="mb-6 text-left">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="related-stories" className="border rounded-md px-3">
                          <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                            Voir {storiesInSameEpic.length} autre(s) story(s) dans l'épique "{currentStory.epic_name || 'N/A'}"
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-3">
                            <ul className="list-disc space-y-1.5 pl-5 text-xs text-muted-foreground max-h-48 overflow-y-auto">
                              {storiesInSameEpic.map((story) => (
                                <li key={story.id} className="break-words">
                                  <span className="font-semibold text-foreground">#{story.id}:</span> {story.description || "(Pas de description)"}
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={evaluations[currentPrinciple.id] === "yes" ? "default" : "outline"}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 h-20 md:h-24 text-xs md:text-sm",
                        evaluations[currentPrinciple.id] === "yes"
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : ""
                      )}
                      onClick={() => handleEvaluationChange(currentPrinciple.id, "yes")}
                      disabled={isSubmitting}
                    >
                      <ThumbsUp className="h-5 w-5 md:h-6 md:w-6 mb-1" /> Oui
                    </Button>
                    <Button
                      variant={
                        evaluations[currentPrinciple.id] === "partial" ? "default" : "outline"
                      }
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 h-20 md:h-24 text-xs md:text-sm",
                        evaluations[currentPrinciple.id] === "partial"
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : ""
                      )}
                      onClick={() => handleEvaluationChange(currentPrinciple.id, "partial")}
                      disabled={isSubmitting}
                    >
                      <HelpCircle className="h-5 w-5 md:h-6 md:w-6 mb-1" /> Partiellement
                    </Button>
                    <Button
                      variant={evaluations[currentPrinciple.id] === "no" ? "default" : "outline"}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 h-20 md:h-24 text-xs md:text-sm",
                        evaluations[currentPrinciple.id] === "no"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : ""
                      )}
                      onClick={() => handleEvaluationChange(currentPrinciple.id, "no")}
                      disabled={isSubmitting}
                    >
                      <ThumbsDown className="h-5 w-5 md:h-6 md:w-6 mb-1" /> Non
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousPrinciple} disabled={isSubmitting}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                {currentPrincipleIndex === 0 ? "Détails de la story" : "Précédent"}
              </Button>
              {currentPrincipleIndex === investPrinciples.length - 1 ? (
                <Button
                  onClick={() => setActiveTab("feedback")}
                  disabled={!evaluations[currentPrinciple.id] || isSubmitting}
                >
                  Continuer vers le retour <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleNextPrinciple}
                  disabled={!evaluations[currentPrinciple.id] || isSubmitting}
                >
                  Principe suivant <ChevronRight className="ml-1 h-4 w-4" />
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
                  index === currentPrincipleIndex
                    ? "bg-primary scale-125 ring-2 ring-primary/30"
                    : evaluations[p.id]
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500",
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
              <CardTitle>Feedback</CardTitle>
              <CardDescription>
                Ajoutez tout commentaire ou suggestion pour améliorer cette user story.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={additionalFeedback}
                onChange={(e) => setAdditionalFeedback(e.target.value)}
                placeholder="Qu'est-ce qui pourrait améliorer cette user story ? Des suggestions spécifiques ?"
                className="min-h-[150px]"
                disabled={isSubmitting}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveTab("evaluate")}
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Retour à l'évaluation
              </Button>
              <Button onClick={handleSubmit} disabled={!isFormComplete() || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours...
                  </>
                ) : (
                  "Envoyer & Continuer"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
