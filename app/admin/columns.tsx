import type { ColumnDef } from "@tanstack/react-table";
import { cn, generateShortStoryTitle } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export type Review = {
  review_id: number;
  storyId: number;
  source_key?: string | null;
  epic_name?: string | null;
  story_title: string;
  tester_name: string;
  additional_feedback: string | null;
  submitted_at: string;
  evaluations: {
    criterion: string;
    rating: number;
  }[];
};

export const columns: ColumnDef<Review>[] = [
  {
    accessorKey: "story_title",
    header: "Titre de la story",
    cell: ({ row }) => {
      const storyDataForTitle = {
        id: row.original.storyId,
        source_key: row.original.source_key,
        epic_name: row.original.epic_name,
      };
      const shortTitle = generateShortStoryTitle(storyDataForTitle);

      return <span title={row.original.story_title}>{shortTitle}</span>;
    },
  },
  {
    accessorKey: "tester_name",
    header: "Testeur",
  },
  {
    accessorKey: "submitted_at",
    header: "Soumis le",
    cell: ({ row }) => {
      const submittedDate = new Date(row.original.submitted_at);
      return (
        <div className="text-xs" title={submittedDate.toLocaleString()}>
          {formatDistanceToNow(submittedDate, { addSuffix: true })}
        </div>
      );
    },
  },
  {
    accessorKey: "evaluations",
    header: "Scores",
    cell: ({ row }) => (
      <div className="space-y-1">
        {row.original.evaluations.map((e, i) => (
          <div key={i} className="text-xs whitespace-nowrap">
            {" "}
            {/* Smaller text, prevent wrap */}
            {e.criterion}:{" "}
            <span
              className={cn(
                e.rating === 5 && "font-semibold text-green-700 dark:text-green-400",
                e.rating === 3 && "font-semibold text-amber-700 dark:text-amber-400",
                e.rating === 1 && "font-semibold text-red-700 dark:text-red-400"
              )}
            >
              {e.rating}/5
            </span>
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
      <p className="max-w-xs text-xs truncate" title={row.original.additional_feedback || ""}>
        {row.original.additional_feedback || (
          <span className="italic text-muted-foreground">Aucun</span>
        )}
      </p>
    ),
  },
];
