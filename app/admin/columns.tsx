// app/admin/columns.ts
import type { ColumnDef } from "@tanstack/react-table"

export type Review = {
  review_id: number
  story_title: string
  tester_name: string
  additional_feedback: string
  evaluations: {
    criterion: string
    rating: number
  }[]
}

export const columns: ColumnDef<Review>[] = [
  {
    accessorKey: "story_title",
    header: "Story Title",
  },
  {
    accessorKey: "tester_name",
    header: "Tester",
  },
  {
    accessorKey: "evaluations",
    header: "Scores",
    cell: ({ row }) => (
      <div className="space-y-1">
        {row.original.evaluations.map((e, i) => (
          <div key={i}>
            {e.criterion}: {e.rating}/5
          </div>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "additional_feedback",
    header: "Feedback",
  },
]
