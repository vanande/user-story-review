"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, RefreshCcw, AlertCircle, Users, Medal, UserCog, ClipboardList, Edit3, BookOpenText, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardStats {
  completed: number;
  total: number;
  left: number;
}

interface TesterDistributionData {
  testerId: number;
  testerEmail: string;
  testerName: string;
  reviewCount: number;
}

const ADMIN_EMAILS = [
  "v.khatchatrian@groupeonepoint.com",
  "m.ortega@groupeonepoint.com",
  "h.imhah@groupeonepoint.com",
];

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
      const namePart = email.split("@")[0];
      setUserName(namePart);
      if (ADMIN_EMAILS.includes(email.toLowerCase())) {
        setIsAdmin(true);
      }
    } else {
      console.warn("Email utilisateur non trouvé sur le tableau de bord. Veuillez vous reconnecter.");
      router.push("/login");
    }
  }, [router]);

  const fetchData = async (email: string) => {
    setLoadingStats(true);
    setLoadingLeaderboard(true);
    setStatsError(null);
    setLeaderboardError(null);
    console.log(`Récupération des données du tableau de bord pour ${email}...`);

    try {
      const [statsResponse, leaderboardResponse] = await Promise.all([
        fetch(`/api/dashboard/stats?email=${encodeURIComponent(email)}`),
        fetch(`/api/admin/stats/tester-review-distribution`),
      ]);

      if (!statsResponse.ok) {
        let errorMsg = `Échec de la récupération des statistiques : ${statsResponse.statusText}`;
        try {
          const errData = await statsResponse.json();
          errorMsg = errData.error || errData.details || errorMsg;
        } catch (e) {
          throw new Error("Échec de l'analyse de la réponse des statistiques : " + e);
        }
        throw new Error(errorMsg);
      }
      const statsResult = await statsResponse.json();
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
        console.log("Statistiques du tableau de bord récupérées :", statsResult.data);
      } else {
        throw new Error(statsResult.error || "Échec de l'obtention de données de statistiques valides depuis l'API");
      }

      if (!leaderboardResponse.ok) {
        let errorMsg = `Échec de la récupération du classement : ${leaderboardResponse.statusText}`;
        try {
          const errData = await leaderboardResponse.json();
          errorMsg = errData.error || errData.details || errorMsg;
        } catch (e) {
          throw new Error("Échec de l'analyse de la réponse du classement : " + e);
        }
        throw new Error(errorMsg);
      }
      const leaderboardResult = await leaderboardResponse.json();
      if (leaderboardResult.success && Array.isArray(leaderboardResult.data)) {
        setLeaderboardData(leaderboardResult.data);
        console.log("Données du classement récupérées :", leaderboardResult.data);
      } else {
        throw new Error(leaderboardResult.error || "Échec de l'obtention de données de classement valides depuis l'API");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données du tableau de bord :", error);
      const errorMsg = error instanceof Error ? error.message : "Impossible de charger les données du tableau de bord.";
      if (errorMsg.includes("statistiques")) {
        setStatsError(errorMsg);
        setStats(null);
      } else if (errorMsg.includes("classement")) {
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

  const topTesters = leaderboardData.slice(0, 5);

  const loggedInUserIndex = leaderboardData.findIndex(
    (t) => t.testerEmail?.toLowerCase() === userEmail?.toLowerCase()
  );
  const loggedInUserStats = loggedInUserIndex !== -1 ? leaderboardData[loggedInUserIndex] : null;
  const loggedInUserRank = loggedInUserIndex !== -1 ? loggedInUserIndex + 1 : null;

  return (
    <div className="container mx-auto max-w-5xl p-4">
      {/* Header */}
      <div className="container mx-auto max-w-5xl p-4">
        {/* --- Header --- */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-3xl font-bold">
            {userName ? `Bonjour, ${userName} !` : "Tableau de bord Testeur"}
          </h1>
          <div className="flex items-center space-x-2">
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => userEmail && fetchData(userEmail)}
              disabled={loadingStats || loadingLeaderboard || !userEmail}
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${loadingStats || loadingLeaderboard ? "animate-spin" : ""}`}
              />
              Rafraîchir
            </Button>

            {/* Admin Area Button (Conditional & FIXED) */}
            {isAdmin && (
              <Button variant="outline" size="sm" asChild className="justify-start">
                <Link href="/admin">
                  {/* Wrap Link content in a single span */}
                  <span className="flex items-center">
                    <UserCog className="mr-2 h-4 w-4" /> Zone Admin
                  </span>
                </Link>
              </Button>
            )}

            {/* Logout Button */}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Main Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Review Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="mr-2 h-5 w-5" />
              Vos statistiques d'annotation
            </CardTitle>
            <CardDescription>Votre progression sur le jeu de données actuel</CardDescription>
          </CardHeader>
          <CardContent>
            {statsError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur de chargement de vos statistiques</AlertTitle>
                <AlertDescription>{statsError}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              {/* User Rank Display */}
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="font-medium">Votre classement :</span>
                {loadingLeaderboard ? (
                  <Skeleton className="h-5 w-12" />
                ) : loggedInUserRank ? (
                  <span className="font-bold">
                    #{loggedInUserRank}
                    <span className="text-xs text-muted-foreground">
                      ({loggedInUserStats?.reviewCount} annotations)
                    </span>
                  </span>
                ) : (
                  <span className="italic text-muted-foreground">Aucune annotation pour l'instant</span>
                )}
              </div>
              <hr className="my-1" />
              {/* Other Stats */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Annotations terminées</span>
                {loadingStats ? (
                  <Skeleton className="h-5 w-10" />
                ) : (
                  <span className="text-sm font-bold">{stats?.completed ?? 0}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Annotations restantes</span>
                {loadingStats ? (
                  <Skeleton className="h-5 w-10" />
                ) : (
                  <span className="text-sm font-bold">{stats?.left ?? "?"}</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span className="italic">Total dans le jeu de données</span>
                {loadingStats ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  <span className="italic">{stats?.total ?? "?"}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start New Review Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Edit3 className="mr-2 h-5 w-5" />
              Commencer une nouvelle annotation
            </CardTitle>
            <CardDescription>Évaluez les user stories selon les principes INVEST</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {loadingLeaderboard ? (
              <Skeleton className="h-6 w-3/4 mb-4" />
            ) : (
              loggedInUserRank === null && (
                <p className="mb-4 text-center text-sm text-green-700 dark:text-green-400 font-medium">
                  Commencez à annoter pour apparaître dans le classement !
                </p>
              )
            )}
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Une user story du jeu de données actif vous sera présentée à la fois.
            </p>
            <Button
              size="lg"
              onClick={() => router.push("/review")}
              className="w-full"
              disabled={loadingStats || (stats !== null && stats.left === 0)}
            >
              {(loadingStats || (stats !== null && stats.left === 0)) ? null : <Play className="mr-2 h-5 w-5" />}
              {loadingStats
                ? "Chargement..."
                : stats !== null && stats.left === 0
                  ? "Toutes les stories sont annotées !"
                  : "Commencer l'annotation"}
            </Button>
          </CardContent>
        </Card>

        {/* Tester Leaderboard Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Classement
            </CardTitle>
            <CardDescription>Top annotateurs (Jeu de données actif)</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboardError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur de chargement du classement</AlertTitle>
                <AlertDescription>{leaderboardError}</AlertDescription>
              </Alert>
            )}
            <div className="min-h-[90px]">
              {loadingLeaderboard ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" /> <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" /> <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : leaderboardData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center pt-4">
                  Aucune annotation soumise pour le moment.
                </p>
              ) : (
                <ul className="space-y-1">
                  {topTesters.map((tester, index) => (
                    <li
                      key={tester.testerId}
                      className={cn(
                        "flex items-center justify-between text-sm p-1 rounded",
                        tester.testerEmail?.toLowerCase() === userEmail?.toLowerCase()
                          ? "bg-blue-100 dark:bg-blue-900/50"
                          : ""
                      )}
                    >
                      <span className="flex items-center font-medium truncate">
                        {index === 0 && (
                          <Medal className="mr-1.5 h-4 w-4 text-yellow-500 flex-shrink-0" />
                        )}
                        {index === 1 && (
                          <Medal className="mr-1.5 h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                        {index === 2 && (
                          <Medal className="mr-1.5 h-4 w-4 text-orange-400 flex-shrink-0" />
                        )}
                        {index > 2 && (
                          <span className="ml-1.5 mr-1.5 h-4 w-4 inline-block flex-shrink-0 text-center">
                            {index + 1}.
                          </span>
                        )}
                        {/* Display testerName (which might be name or email) */}
                        <span className="truncate" title={tester.testerName}>
                          {tester.testerName.split("@")[0]}
                        </span>
                      </span>
                      <Badge variant="secondary">{tester.reviewCount}</Badge>
                    </li>
                  ))}
                  {loggedInUserStats && loggedInUserRank && loggedInUserRank > 5 && (
                    <>
                      <li className="text-center text-muted-foreground text-xs my-1">...</li>
                      <li
                        className={cn(
                          "flex items-center justify-between text-sm p-1 rounded",
                          "bg-blue-100 dark:bg-blue-900/50"
                        )}
                      >
                        <span className="flex items-center font-medium truncate">
                          <span className="ml-1.5 mr-1.5 h-4 w-4 inline-block flex-shrink-0 text-center">
                            {loggedInUserRank}.
                          </span>
                          <span className="truncate" title={loggedInUserStats.testerName}>
                            {loggedInUserStats.testerName.split("@")[0]}
                          </span>
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
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpenText className="mr-2 h-6 w-6" />
              Référence Principes INVEST
            </CardTitle>
            <CardDescription>Un rappel rapide de ce que chaque principe signifie</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-4 text-sm">
              <li>
                <strong>Indépendant (I) :</strong>
                <p className="text-muted-foreground mt-1">
                  La user story est autonome et peut être développée et livrée sans dépendre d'autres stories.
                </p>
                <p className="mt-1 text-xs italic text-muted-foreground/80">
                  Questions clés : Peut-on la prioriser indépendamment ? Peut-on la réaliser sans autre story ?
                </p>
              </li>
              <li>
                <strong>Négociable (N) :</strong>
                <p className="text-muted-foreground mt-1">
                  Les détails de la story sont discutables et affinables entre le Product Owner et l'équipe de développement. Elle n'est pas un contrat figé.
                </p>
                <p className="mt-1 text-xs italic text-muted-foreground/80">
                  Questions clés : Y a-t-il de la place pour la discussion sur les détails ? La portée est-elle flexible ?
                </p>
              </li>
              <li>
                <strong>Valeur (V) :</strong>
                <p className="text-muted-foreground mt-1">
                  La story apporte une valeur métier claire et identifiable pour l'utilisateur final ou le client.
                </p>
                <p className="mt-1 text-xs italic text-muted-foreground/80">
                  Questions clés : Pourquoi faisons-nous cela ? Quel bénéfice pour l'utilisateur ?
                </p>
              </li>
              <li>
                <strong>Estimable (E) :</strong>
                <p className="text-muted-foreground mt-1">
                  L'équipe de développement peut estimer l'effort nécessaire pour réaliser la story, même approximativement.
                </p>
                <p className="mt-1 text-xs italic text-muted-foreground/80">
                  Questions clés : L'équipe comprend-elle assez la story pour l'estimer ? Les dépendances ou incertitudes sont-elles gérables ?
                </p>
              </li>
              <li>
                <strong>Petite (S - Small) :</strong>
                <p className="text-muted-foreground mt-1">
                  La story est suffisamment petite pour être réalisable en une seule itération (sprint) par l'équipe.
                </p>
                <p className="mt-1 text-xs italic text-muted-foreground/80">
                  Questions clés : Peut-on la finir en un sprint ? Est-elle décomposable si trop grosse ?
                </p>
              </li>
              <li>
                <strong>Testable (T) :</strong>
                <p className="text-muted-foreground mt-1">
                  Il existe des critères d'acceptation clairs et concrets permettant de vérifier que la story est terminée et fonctionne comme attendu.
                </p>
                <p className="mt-1 text-xs italic text-muted-foreground/80">
                  Questions clés : Comment saurons-nous que c'est terminé ? Pouvons-nous écrire des tests (automatisés ou manuels) ?
                </p>
              </li>
            </ul>
            <div className="mt-6 text-center">
              <a
                href="https://actually-hyacinth-caf.notion.site/INVEST-Method-1ebd5c7edeb58096955ed814b01d738b?pvs=4"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                En savoir plus sur la méthode INVEST
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
