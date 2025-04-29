import { GET } from "@/app/api/admin/active-reviews/route";
import { describe, it, expect } from "@jest/globals";

describe("Active Reviews API Handler Logic", () => { // Updated describe title
  it("returns active review sessions (mock data)", async () => {
    const request = new Request("http://localhost:3000/api/admin/active-reviews");
    const response = await GET(request);
    const data = await response.json();
    console.log(data);

    // Structure checks remain the same
    if (data.data.length > 0) {
      const firstReview = data.data[0];
      expect(firstReview).toHaveProperty("id");
      expect(firstReview).toHaveProperty("testerId");
    }
  });
});