import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { generateShortStatTitle } from "@/lib/utils";

interface PrincipleStatistic {
  id: string;
  principleId: number;
  principleName: string;
  storyId: number | null;
  storyTitle: string | null;
  source_key?: string | null;
  epic_name?: string | null;
  yesCount: number;
  partialCount: number;
  noCount: number;
  totalReviews: number;
}

interface PrincipleStatisticsCardProps {
  data: PrincipleStatistic;
}

export function PrincipleStatisticsCard({ data }: PrincipleStatisticsCardProps) {
  const yesCount = data.yesCount || 0;
  const partialCount = data.partialCount || 0;
  const noCount = data.noCount || 0;
  const total = yesCount + partialCount + noCount;
  const yesPercentage = total > 0 ? Math.round((yesCount / total) * 100) : 0;
  const partialPercentage = total > 0 ? Math.round((partialCount / total) * 100) : 0;
  const noPercentage = total > 0 ? Math.round((noCount / total) * 100) : 0;

  const displayTitle = generateShortStatTitle(data);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{data.principleName}</CardTitle>
        <CardDescription>
          {/* Use the generated short title */}
          {data.storyId !== null ? `For Story: "${displayTitle}"` : "Across all stories"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* ... rest of card content using yesCount, partialCount etc. ... */}
        <div className="space-y-2">
          {/* Yes */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-600">Yes</span>
            <span className="text-sm font-medium">
              {yesCount} ({yesPercentage}%)
            </span>
          </div>
          <Progress value={yesPercentage} className="h-2 [&>div]:bg-green-500" />
          {/* Partially */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-medium text-amber-600">Partially</span>
            <span className="text-sm font-medium">
              {partialCount} ({partialPercentage}%)
            </span>
          </div>
          <Progress value={partialPercentage} className="h-2 [&>div]:bg-amber-500" />
          {/* No */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-medium text-red-600">No</span>
            <span className="text-sm font-medium">
              {noCount} ({noPercentage}%)
            </span>
          </div>
          <Progress value={noPercentage} className="h-2 [&>div]:bg-red-500" />
          {/* Total */}
          <div className="pt-2 text-sm text-muted-foreground">
            Based on {total || 0} evaluations
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
