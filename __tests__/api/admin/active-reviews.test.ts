import { GET } from "@/app/api/admin/active-reviews/route";
import { describe, it, expect } from "@jest/globals";

describe("Active Reviews API Handler Logic", () => {
  it("returns active review sessions (mock data)", async () => {
    const response = await GET();
    const data = await response.json();
    console.log(data);

    if (data.data.length > 0) {
      const firstReview = data.data[0];
      expect(firstReview).toHaveProperty("id");
      expect(firstReview).toHaveProperty("testerId");
    }
  });
});
