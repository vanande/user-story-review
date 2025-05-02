"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

interface RecentReviewDisplay {
  id: number;
  testerId: number;
  testerName: string;
  storyId: number;
  storyTitle: string;
  fullStoryTitle?: string;
  submittedAt: string;
}

interface RecentReviewsTableProps {
  data: RecentReviewDisplay[];
}

export function ActiveReviewsTable({ data }: RecentReviewsTableProps) {
  const formatToParisTime = (dateStringUTC: string): string => {
    try {
      const date = new Date(dateStringUTC);
      return date.toLocaleString("fr-FR", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tester</TableHead>
            <TableHead>Story (Short Title)</TableHead>
            <TableHead>Submitted At (Paris Time)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                No recent reviews found for the selected period.
              </TableCell>
            </TableRow>
          ) : (
            data.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="font-medium">{review.testerName}</TableCell>
                <TableCell title={review.fullStoryTitle || review.storyTitle}>
                  {review.storyTitle}
                </TableCell>
                <TableCell>
                  <span title={review.submittedAt}>
                    {" "}
                    {/* Show original UTC on hover */}
                    {formatToParisTime(review.submittedAt)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    ({formatDistanceToNow(new Date(review.submittedAt), { addSuffix: true })})
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
