import { NextResponse } from "next/server";
import { openDb } from "@/lib/db"; // Import DB helper

// REMOVE: getMockReviews function

export async function GET() {
  let db;
  try {
    db = await openDb();

    // 1. Fetch all reviews with basic info
    const reviewsQuery = `
      SELECT
        r.id as review_id,
        s.title as story_title,
        COALESCE(t.name, t.email) as tester_name, -- Use name, fallback to email
        r.additional_feedback,
        r.submitted_at
      FROM reviews r
      JOIN user_stories s ON r.story_id = s.id
      JOIN testers t ON r.tester_id = t.id
      ORDER BY r.submitted_at DESC
    `;
    const reviewsData = await db.all(reviewsQuery);

    if (reviewsData.length === 0) {
      return NextResponse.json({ reviews: [] }); // Return empty if no reviews
    }

    // 2. Fetch all criterion evaluations for these reviews
    const reviewIds = reviewsData.map(r => r.review_id);
    const evaluationsQuery = `
        SELECT
            ce.review_id,
            ec.name as criterion,
            ce.rating
        FROM criterion_evaluations ce
        JOIN evaluation_criteria ec ON ce.criterion_id = ec.id
        WHERE ce.review_id IN (${reviewIds.map(() => '?').join(',')}) -- Parameter placeholders
    `;
    const evaluationsData = await db.all(evaluationsQuery, reviewIds);

    // 3. Group evaluations by review_id in application code
    const evaluationsMap = new Map<number, { criterion: string; rating: number }[]>();
    evaluationsData.forEach(ev => {
      const existing = evaluationsMap.get(ev.review_id) || [];
      existing.push({ criterion: ev.criterion, rating: ev.rating });
      evaluationsMap.set(ev.review_id, existing);
    });

    // 4. Combine reviews with their grouped evaluations
    const results = reviewsData.map(review => ({
      ...review,
      evaluations: evaluationsMap.get(review.review_id) || [], // Attach grouped evaluations
    }));

    console.log(`Fetched ${results.length} reviews from DB for admin.`);
    return NextResponse.json({ reviews: results });

  } catch (error) {
    console.error("Error fetching admin reviews from database:", error);
    return NextResponse.json(
        {
          error: "Failed to fetch reviews",
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
    );
  } finally {
    if (db) {
      await db.close();
    }
  }
}