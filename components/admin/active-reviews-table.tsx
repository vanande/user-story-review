"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns"

interface ActiveReview {
  id: number
  testerId: number
  testerName: string
  storyId: number
  storyTitle: string
  startedAt: string
  progress: number
}

interface ActiveReviewsTableProps {
  data: ActiveReview[]
}

export function ActiveReviewsTable({ data }: ActiveReviewsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tester</TableHead>
            <TableHead>Story</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No active reviews
              </TableCell>
            </TableRow>
          ) : (
            data.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="font-medium">{review.testerName}</TableCell>
                <TableCell>{review.storyTitle}</TableCell>
                <TableCell>{formatDistanceToNow(new Date(review.startedAt), { addSuffix: true })}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${review.progress}%` }}></div>
                    </div>
                    <span className="text-xs font-medium">{review.progress}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
