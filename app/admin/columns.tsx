// app/admin/columns.tsx
import type { ColumnDef } from "@tanstack/react-table";
import {cn, generateShortStoryTitle} from "@/lib/utils"; // Import helper
import { formatDistanceToNow } from "date-fns"; // Import date formatting

// Review type reflecting data from /api/admin/reviews
export type Review = {
  review_id: number;
  storyId: number;
  source_key?: string | null;
  epic_name?: string | null;
  story_title: string; // Original long title/description
  tester_name: string;
  additional_feedback: string | null; // Allow null feedback
  submitted_at: string; // Added from API
  evaluations: {
    criterion: string;
    rating: number;
  }[];
};

export const columns: ColumnDef<Review>[] = [
  {
    accessorKey: "story_title", // Keep accessor for potential sorting/filtering on original title
    header: "Story Title",
    cell: ({ row }) => {
      // --- FIX: Map storyId to id for the helper function ---
      const storyDataForTitle = {
        id: row.original.storyId, // Use storyId from Review type
        source_key: row.original.source_key,
        epic_name: row.original.epic_name
      };
      const shortTitle = generateShortStoryTitle(storyDataForTitle);
      // ------------------------------------------------------
      // Use original long title for the hover tooltip
      return <span title={row.original.story_title}>{shortTitle}</span>;
    },
    // Optional: Enable sorting based on the generated short title if needed
    // sortingFn: (rowA, rowB, columnId) => { ... custom sort logic ... }
  },
  {
    accessorKey: "tester_name",
    header: "Tester",
  },
  {
    accessorKey: "submitted_at",
    header: "Submitted",
    cell: ({ row }) => {
      const submittedDate = new Date(row.original.submitted_at);
      return (
          <div className="text-xs" title={submittedDate.toLocaleString()}>
            {formatDistanceToNow(submittedDate, { addSuffix: true })}
          </div>
      )
    }
  },
  {
    accessorKey: "evaluations",
    header: "Scores",
    cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.evaluations.map((e, i) => (
              <div key={i} className="text-xs whitespace-nowrap"> {/* Smaller text, prevent wrap */}
                {e.criterion}: <span className={cn(
                    e.rating === 5 && "font-semibold text-green-700 dark:text-green-400",
                    e.rating === 3 && "font-semibold text-amber-700 dark:text-amber-400",
                    e.rating === 1 && "font-semibold text-red-700 dark:text-red-400",
                )}>{e.rating}/5</span>
              </div>
          ))}
        </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "additional_feedback",
    header: "Feedback",
    cell: ({ row }) => (
        <p className="max-w-xs text-xs truncate" title={row.original.additional_feedback || ''}>
          {row.original.additional_feedback || <span className="italic text-muted-foreground">None</span>}
        </p>
    )
  },
];