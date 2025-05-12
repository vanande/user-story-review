import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { generateShortStatTitle } from "@/lib/utils";

interface StoryStatistic {
  id: string;
  storyId: number;
  storyTitle: string | null;
  source_key?: string | null;
  epic_name?: string | null;
  principleId?: string | null;
  principleName: string | null;
  averageRating: number;
  totalReviews: number;
  meetsCriteria: number;
}

interface StoryStatisticsCardProps {
  data: StoryStatistic;
}

export function StoryStatisticsCard({ data }: StoryStatisticsCardProps) {
  const totalReviews = data.totalReviews || 0;
  const meetsCriteria = data.meetsCriteria || 0;
  const averageRating = data.averageRating || 0;
  const meetsPercentage = totalReviews > 0 ? Math.round((meetsCriteria / totalReviews) * 100) : 0;
  let status: "positive" | "warning" | "negative" | "neutral" = "neutral";
  let statusText = "Neutre";
  if (meetsPercentage >= 80) {
    status = "positive";
    statusText = "Fort";
  } else if (meetsPercentage >= 50) {
    status = "warning";
    statusText = "Modéré";
  } else if (totalReviews > 0) {
    status = "negative";
    statusText = "Faible";
  }

  const displayTitle = generateShortStatTitle(data);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          {/* Use the generated short title */}
          <CardTitle className="text-lg">{displayTitle}</CardTitle>
          <Badge
            variant={
              status === "negative" ? "destructive" : status === "neutral" ? "secondary" : "outline"
            }
            className={cn(
              status === "positive" &&
                "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300",
              status === "warning" &&
                "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300",

              "text-xs px-2 py-0.5"
            )}
          >
            {statusText}
          </Badge>
        </div>
        <CardDescription>
          {data.principleName ? `Pour le principe "${data.principleName}"` : "Tous principes confondus"}
          {/* Optional: Show long title on hover over short title */}
          {data.storyTitle && (
            <span
              className="block text-xs italic text-muted-foreground truncate"
              title={data.storyTitle}
            >
              ({data.storyTitle})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* ... rest of card content ... */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Respecte les critères</span>
            <span className="text-sm font-medium">
              {meetsCriteria} sur {totalReviews} ({meetsPercentage}%)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Note moyenne</span>
            <div className="flex items-center">
              {/* Star logic */}
              <span className="ml-1 text-sm font-medium">{averageRating.toFixed(1)}</span>
            </div>
          </div>
          <div className="pt-2 text-sm text-muted-foreground">
            Basé sur {totalReviews} évaluations
            {data.principleName ? ` pour ${data.principleName}` : ""}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
