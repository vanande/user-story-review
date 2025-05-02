import { GET } from "@/app/api/stories/route";
import fs from "fs/promises";
import path from "path";

jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
}));
const mockMath = Object.create(global.Math);
mockMath.random = () => 0.5;
global.Math = mockMath;

describe("Stories API Handler Logic (JSON)", () => {
  const mockJsonData = {
    /* ... same mock data ... */
    source1: {
      epics: [
        {
          epic: "Epic 1",
          user_stories: [
            { user_story: "Story 1 desc", acceptance_criteria: ["ac1"], independent: true },
            { user_story: "Story 2 desc", acceptance_criteria: ["ac2"], valuable: true },
            { user_story: "Story 3 desc", acceptance_criteria: ["ac3"], testable: true },
          ],
        },
      ],
    },
    source2: {
      epics: [
        {
          epic: "Epic 2",
          user_stories: [
            { user_story: "Story 4 desc", acceptance_criteria: ["ac4"], small: true },
            { user_story: "Story 5 desc", acceptance_criteria: ["ac5"], negotiable: false },
            { user_story: "Story 6 desc", acceptance_criteria: ["ac6"], estimable: true },
            { user_story: "Story 7 desc", acceptance_criteria: ["ac7"] },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockJsonData));
  });

  it("should return 5 random stories from merged.json", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(fs.readFile).toHaveBeenCalledWith(
      expect.stringContaining(path.join("data", "merged.json")),
      "utf-8"
    );
    expect(data.stories).toHaveLength(5);

    const firstStory = data.stories[0];
    expect(firstStory).toHaveProperty("id");
    expect(firstStory).toHaveProperty("title");
  });

  it("should handle errors during file reading", async () => {
    const mockError = new Error("Failed to read file");
    (fs.readFile as jest.Mock).mockRejectedValue(mockError);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch stories from file");
    expect(data.details).toBe(mockError.message);
  });

  it("should handle errors during JSON parsing", async () => {
    (fs.readFile as jest.Mock).mockResolvedValue("this is not json");

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch stories from file");
    expect(data.details).toContain("Unexpected token");
  });
});
