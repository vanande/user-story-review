// components/admin/story-statistics-card.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // Import cn if needed for badge styling
import { generateShortStatTitle } from "@/lib/utils"; // Import helper

// Update interface
interface StoryStatistic {
  id: string;
  storyId: number;
  storyTitle: string | null; // Long title/desc
  source_key?: string | null; // Added
  epic_name?: string | null; // Added
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
  // ... (percentage and status calculations remain same) ...
  const totalReviews = data.totalReviews || 0;
  const meetsCriteria = data.meetsCriteria || 0;
  const averageRating = data.averageRating || 0;
  const meetsPercentage = totalReviews > 0 ? Math.round((meetsCriteria / totalReviews) * 100) : 0;
  let status: "positive" | "warning" | "negative" | "neutral" = "neutral";
  let statusText = "Neutral";
  if (meetsPercentage >= 80) { status = "positive"; statusText = "Strong"; }
  else if (meetsPercentage >= 50) { status = "warning"; statusText = "Moderate"; }
  else if (totalReviews > 0) { status = "negative"; statusText = "Weak"; }


  // Generate short title for display
  const displayTitle = generateShortStatTitle(data);

  return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            {/* Use the generated short title */}
            <CardTitle className="text-lg">{displayTitle}</CardTitle>
            <Badge
                // Set the base variant depending on the status
                variant={
                  status === "negative" ? "destructive" // Use built-in red variant
                      : status === "neutral" ? "secondary" // Use built-in gray variant
                          : "outline" // Use outline for positive/warning, apply colors via className
                }
                // Apply specific background/text/border colors using cn for different statuses
                className={cn(
                    status === 'positive' && 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300', // Specific green styling
                    status === 'warning' && 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300', // Specific amber styling
                    // No extra classes needed for 'destructive' or 'secondary' unless you want to override defaults
                    'text-xs px-2 py-0.5' // Ensure consistent padding/size if needed
                )}
            >
              {statusText}
            </Badge>
          </div>
          <CardDescription>
            {data.principleName ? `For "${data.principleName}" principle` : "Across all principles"}
            {/* Optional: Show long title on hover over short title */}
            {data.storyTitle && <span className="block text-xs italic text-muted-foreground truncate" title={data.storyTitle}>({data.storyTitle})</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* ... rest of card content ... */}
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-sm font-medium">Meets Criteria</span><span className="text-sm font-medium">{meetsCriteria} of {totalReviews} ({meetsPercentage}%)</span></div>
            <div className="flex items-center justify-between"><span className="text-sm font-medium">Average Rating</span><div className="flex items-center">{/* Star logic */}<span className="ml-1 text-sm font-medium">{averageRating.toFixed(1)}</span></div></div>
            <div className="pt-2 text-sm text-muted-foreground">Based on {totalReviews} evaluations {data.principleName ? ` for ${data.principleName}` : ''}</div>
          </div>
        </CardContent>
      </Card>
  );
}