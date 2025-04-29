// components/admin/active-reviews-table.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns"; // Keep for relative time

// Interface matching data passed from monitoring page
interface RecentReviewDisplay {
  id: number;
  testerId: number;
  testerName: string;
  storyId: number;
  storyTitle: string; // Short title
  fullStoryTitle?: string;
  submittedAt: string; // UTC ISO String from DB
}

interface RecentReviewsTableProps {
  data: RecentReviewDisplay[];
}

// Renamed component for clarity
export function ActiveReviewsTable({ data }: RecentReviewsTableProps) { // Consider renaming component file too

  // Helper function to format date to Paris time
  const formatToParisTime = (dateStringUTC: string): string => {
    try {
      const date = new Date(dateStringUTC);
      return date.toLocaleString('fr-FR', { // Use French locale for formatting conventions
        timeZone: 'Europe/Paris',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false // Use 24-hour format
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date"; // Fallback
    }
  };


  return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tester</TableHead>
              <TableHead>Story (Short Title)</TableHead>
              <TableHead>Submitted At (Paris Time)</TableHead> {/* Updated Header */}
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
                      {/* MODIFIED: Display formatted Paris time and relative time */}
                      <TableCell>
                    <span title={review.submittedAt}> {/* Show original UTC on hover */}
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