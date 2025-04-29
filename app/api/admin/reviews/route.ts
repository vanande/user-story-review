// app/api/admin/reviews/route.ts
import { NextResponse } from "next/server";
import { openDb } from "@/lib/db";

export async function GET() {
  let db;
  try {
    db = await openDb();

    // Fetch reviews joining with stories and testers
    const reviewsQuery = `
      SELECT
        r.id as review_id,
        s.id as storyId,          -- Added story ID
        s.title as story_title,   -- This is the long title/description
        s.source_key,             -- Added source key
        s.epic_name,              -- Added epic name
        COALESCE(t.name, t.email) as tester_name,
        r.additional_feedback,
        r.submitted_at
      FROM reviews r
             JOIN user_stories s ON r.story_id = s.id
             JOIN testers t ON r.tester_id = t.id
      ORDER BY r.submitted_at DESC
        LIMIT 200 -- Add a reasonable limit for admin view
    `;
    const reviewsData = await db.all(reviewsQuery);

    if (!reviewsData || reviewsData.length === 0) {
      return NextResponse.json({ reviews: [] });
    }

    // Fetch evaluations separately and group them
    const reviewIds = reviewsData.map(r => r.review_id);
    const evaluationsQuery = `
      SELECT
        ce.review_id,
        ec.name as criterion,
        ce.rating
      FROM criterion_evaluations ce
             JOIN evaluation_criteria ec ON ce.criterion_id = ec.id
      WHERE ce.review_id IN (${reviewIds.map(() => '?').join(',')})
    `;
    const evaluationsData = await db.all(evaluationsQuery, reviewIds);

    const evaluationsMap = new Map<number, { criterion: string; rating: number }[]>();
    evaluationsData.forEach(ev => {
      const existing = evaluationsMap.get(ev.review_id) || [];
      existing.push({ criterion: ev.criterion, rating: ev.rating });
      evaluationsMap.set(ev.review_id, existing);
    });

    // Combine results
    const results = reviewsData.map(review => ({
      ...review,
      evaluations: evaluationsMap.get(review.review_id) || [],
    }));

    console.log(`Fetched ${results.length} reviews from DB for admin.`);
    return NextResponse.json({ reviews: results });

  } catch (error) {
    console.error("Error fetching admin reviews from database:", error);
    return NextResponse.json(
        { error: "Failed to fetch reviews", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
    );
  } finally {
    if (db) { await db.close(); }
  }
}