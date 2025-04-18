import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface PrincipleStatistic {
  id: string
  principleId: string
  principleName: string
  storyId: number
  storyTitle: string
  yesCount: number
  partialCount: number
  noCount: number
  totalReviews: number
}

interface PrincipleStatisticsCardProps {
  data: PrincipleStatistic
}

export function PrincipleStatisticsCard({ data }: PrincipleStatisticsCardProps) {
  const total = data.yesCount + data.partialCount + data.noCount

  const yesPercentage = total > 0 ? Math.round((data.yesCount / total) * 100) : 0
  const partialPercentage = total > 0 ? Math.round((data.partialCount / total) * 100) : 0
  const noPercentage = total > 0 ? Math.round((data.noCount / total) * 100) : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{data.principleName}</CardTitle>
        <CardDescription>
          {data.storyTitle !== "All Stories" ? `For "${data.storyTitle}"` : "Across all stories"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-600">Yes</span>
            <span className="text-sm font-medium">
              {data.yesCount} ({yesPercentage}%)
            </span>
          </div>
          <Progress value={yesPercentage} className="h-2" indicator="bg-green-500" />

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-600">Partially</span>
            <span className="text-sm font-medium">
              {data.partialCount} ({partialPercentage}%)
            </span>
          </div>
          <Progress value={partialPercentage} className="h-2" indicator="bg-amber-500" />

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-red-600">No</span>
            <span className="text-sm font-medium">
              {data.noCount} ({noPercentage}%)
            </span>
          </div>
          <Progress value={noPercentage} className="h-2" indicator="bg-red-500" />

          <div className="pt-2 text-sm text-muted-foreground">Based on {total} reviews</div>
        </div>
      </CardContent>
    </Card>
  )
}
