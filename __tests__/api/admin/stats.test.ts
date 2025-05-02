import { NextRequest } from "next/server";
import { GET as getPrincipleStats } from "@/app/api/admin/stats/principles/route";
import { GET as getStoryStats } from "@/app/api/admin/stats/stories/route";
import { describe, it, expect } from "@jest/globals";

describe("Admin Statistics APIs", () => {
  describe("Principle Statistics API", () => {
    it("returns principle statistics", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/stats/principles");
      const response = await getPrincipleStats(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);

      if (data.data.length > 0) {
        const firstStat = data.data[0];
        expect(firstStat).toHaveProperty("principleId");
        expect(firstStat).toHaveProperty("principleName");
        expect(firstStat).toHaveProperty("storyId");
        expect(firstStat).toHaveProperty("storyTitle");
        expect(firstStat).toHaveProperty("yesCount");
        expect(firstStat).toHaveProperty("partialCount");
        expect(firstStat).toHaveProperty("noCount");
        expect(firstStat).toHaveProperty("totalReviews");
      }
    });

    it("filters by storyId", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/stats/principles?storyId=1");
      const response = await getPrincipleStats(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      data.data.forEach((stat: any) => {
        expect(stat.storyId).toBe(1);
      });
    });
  });

  describe("Story Statistics API", () => {
    it("returns story statistics", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/stats/stories");
      const response = await getStoryStats(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);

      if (data.data.length > 0) {
        const firstStat = data.data[0];
        expect(firstStat).toHaveProperty("storyId");
        expect(firstStat).toHaveProperty("storyTitle");
        expect(firstStat).toHaveProperty("principleId");
        expect(firstStat).toHaveProperty("principleName");
        expect(firstStat).toHaveProperty("averageRating");
        expect(firstStat).toHaveProperty("totalReviews");
        expect(firstStat).toHaveProperty("meetsCriteria");
      }
    });

    it("filters by principleId", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/stats/stories?principleId=independent"
      );
      const response = await getStoryStats(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      data.data.forEach((stat: any) => {
        expect(stat.principleId).toBe("independent");
      });
    });
  });
});
