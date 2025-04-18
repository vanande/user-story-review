import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StoryStatistic {
  id: string
  storyId: number
  storyTitle: string
  principleId: string
  principleName: string
  averageRating: number
  totalReviews: number
  meetsCriteria: number
}

interface StoryStatisticsCardProps {
  data: StoryStatistic
}

export function StoryStatisticsCard({ data }: StoryStatisticsCardProps) {
  const meetsPercentage = data.totalReviews > 0 ? Math.round((data.meetsCriteria / data.totalReviews) * 100) : 0

  // Determine status based on percentage
  let status = "neutral"
  let statusText = "Neutral"

  if (meetsPercentage >= 80) {
    status = "positive"
    statusText = "Strong"
  } else if (meetsPercentage >= 50) {
    status = "warning"
    statusText = "Moderate"
  } else if (data.totalReviews > 0) {
    status = "negative"
    statusText = "Weak"
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{data.storyTitle}</CardTitle>
          <Badge
            variant={
              status === "positive"
                ? "default"
                : status === "warning"
                  ? "outline"
                  : status === "negative"
                    ? "destructive"
                    : "secondary"
            }
          >
            {statusText}
          </Badge>
        </div>
        <CardDescription>
          {data.principleName !== "All Principles" ? `For "${data.principleName}" principle` : "Across all principles"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Meets Criteria</span>
            <span className="text-sm font-medium">
              {data.meetsCriteria} of {data.totalReviews} ({meetsPercentage}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Average Rating</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`h-4 w-4 ${star <= Math.round(data.averageRating) ? "text-yellow-400" : "text-gray-300"}`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                    clipRule="evenodd"
                  />
                </svg>
              ))}
              <span className="ml-1 text-sm font-medium">{data.averageRating.toFixed(1)}</span>
            </div>
          </div>

          <div className="pt-2 text-sm text-muted-foreground">Based on {data.totalReviews} reviews</div>
        </div>
      </CardContent>
    </Card>
  )
}
