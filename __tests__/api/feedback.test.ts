import { POST } from "@/app/api/feedback/route";
import "@testing-library/jest-dom";

jest.mock("sqlite", () => ({
  open: jest.fn(),
}));
jest.mock("sqlite3");
import { open } from "sqlite";

describe("Feedback API Handler Logic (SQLite)", () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      exec: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(undefined),
      run: jest.fn().mockImplementation((sql: string) => {
        if (sql.includes("INSERT INTO testers")) return Promise.resolve({ lastID: 1, changes: 1 });
        if (sql.includes("INSERT INTO reviews"))
          return Promise.resolve({ lastID: 123, changes: 1 });
        if (sql.includes("INSERT INTO criterion_evaluations"))
          return Promise.resolve({ changes: 1 });
        return Promise.resolve({ changes: 0 });
      }),
      all: jest.fn().mockResolvedValue([
        { id: 1, name: "Independent" },
        { id: 2, name: "Negotiable" },
        { id: 3, name: "Valuable" },
        { id: 4, name: "Estimable" },
        { id: 5, name: "Small" },
        { id: 6, name: "Testable" },
      ]),
      close: jest.fn().mockResolvedValue(undefined),
    };
    (open as jest.Mock).mockResolvedValue(mockDb);
  });

  const createMockRequest = (body: any) => ({
    json: async () => body,
  });

  it("should store feedback successfully for existing tester", async () => {
    mockDb.get.mockImplementation((sql: string, params: any[]) =>
      sql.includes("testers") && params[0] === "test@example.com"
        ? Promise.resolve({ id: 99 })
        : Promise.resolve(undefined)
    );

    const mockRequestBody = {
      storyId: 1,
      email: "test@example.com",
      evaluations: { Independent: "yes", Negotiable: "partial" },
      additionalFeedback: "Good story",
    };
    const mockRequest = createMockRequest(mockRequestBody);

    const response = await POST(mockRequest as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.reviewId).toBe(123);

    expect(mockDb.exec).toHaveBeenCalledWith("BEGIN TRANSACTION");
    expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO reviews"), [
      1,
      99,
      "Good story",
    ]);
    expect(mockDb.run).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO criterion_evaluations"),
      [123, 1, 5]
    );
    expect(mockDb.exec).toHaveBeenCalledWith("COMMIT TRANSACTION");
    expect(mockDb.close).toHaveBeenCalled();
  });

  it("should create a new tester if email not found", async () => {
    const mockRequestBody = {
      storyId: 2,
      email: "new@example.com",
      evaluations: { Independent: "no" },
      additionalFeedback: "New tester feedback",
    };
    const mockRequest = createMockRequest(mockRequestBody);

    const response = await POST(mockRequest as any);
    const data = await response.json();

    expect(response.status).toBe(201);

    expect(mockDb.run).toHaveBeenCalledWith("INSERT INTO testers (email, name) VALUES (?, ?)", [
      "new@example.com",
      "new",
    ]);
    expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO reviews"), [
      2,
      1,
      "New tester feedback",
    ]);
    expect(mockDb.exec).toHaveBeenCalledWith("COMMIT TRANSACTION");
  });

  it("should handle missing required fields", async () => {
    const mockRequestBody = { storyId: 1 };
    const mockRequest = createMockRequest(mockRequestBody);

    const response = await POST(mockRequest as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Missing required fields");
    expect(open).not.toHaveBeenCalled();
  });

  it("should handle invalid email format", async () => {
    const mockRequestBody = { storyId: 1, email: "bad-email", evaluations: {} };
    const mockRequest = createMockRequest(mockRequestBody);

    const response = await POST(mockRequest as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid email format");
    expect(open).not.toHaveBeenCalled();
  });

  it("should handle unknown criterion and rollback", async () => {
    const mockRequestBody = {
      storyId: 1,
      email: "test@example.com",
      evaluations: { UnknownCrit: "yes" },
      additionalFeedback: "",
    };
    const mockRequest = createMockRequest(mockRequestBody);

    const response = await POST(mockRequest as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Unknown criterion: UnknownCrit");
    expect(mockDb.exec).toHaveBeenCalledWith("ROLLBACK TRANSACTION");
    expect(mockDb.exec).not.toHaveBeenCalledWith("COMMIT TRANSACTION");
  });

  it("should handle database errors during transaction and rollback", async () => {
    mockDb.run.mockImplementation((sql: string) => {
      if (sql.includes("INSERT INTO reviews")) return Promise.reject(new Error("DB Fail"));
      return Promise.resolve({ lastID: 1, changes: 1 });
    });

    const mockRequestBody = {
      storyId: 1,
      email: "test@example.com",
      evaluations: {},
      additionalFeedback: "",
    };
    const mockRequest = createMockRequest(mockRequestBody);

    const response = await POST(mockRequest as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to process feedback");
    expect(data.details).toBe("DB Fail");
    expect(mockDb.exec).toHaveBeenCalledWith("ROLLBACK TRANSACTION");
  });
});
