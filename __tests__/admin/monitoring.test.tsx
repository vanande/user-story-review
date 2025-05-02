import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminMonitoringPage from "@/app/admin/monitoring/page";
import { mockUserStories, mockPrinciples, mockActiveReviews } from "@/lib/mock-data";

global.fetch = jest.fn();

jest.mock("react-chartjs-2", () => ({
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Pie: () => <div data-testid="pie-chart">Pie Chart</div>,
}));

describe("Admin Monitoring Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/admin/stories")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUserStories }),
        });
      } else if (url.includes("/api/admin/principles")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockPrinciples }),
        });
      } else if (url.includes("/api/admin/active-reviews")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockActiveReviews }),
        });
      } else if (url.includes("/api/admin/stats/principles")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      } else if (url.includes("/api/admin/stats/stories")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      }
      return Promise.reject(new Error("Not found"));
    });
  });

  it("renders the monitoring dashboard with mock data", () => {
    render(<AdminMonitoringPage />);

    expect(screen.getByText("Review Monitoring Dashboard")).toBeInTheDocument();

    expect(screen.getByText("Use Mock Data")).toBeInTheDocument();

    expect(screen.getByText("Active Reviews")).toBeInTheDocument();

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("toggles between mock and real data", async () => {
    render(<AdminMonitoringPage />);

    const mockDataSwitch = screen.getByRole("switch", { name: "Use Mock Data" });
    expect(mockDataSwitch).toBeChecked();

    fireEvent.click(mockDataSwitch);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(5);
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/stories");
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/principles");
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/active-reviews");
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/stats/principles");
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/stats/stories");
    });
  });

  it("handles filter changes", () => {
    render(<AdminMonitoringPage />);

    const storySelect = screen.getByText("All Stories");
    fireEvent.click(storySelect);

    const storyOption = screen.getByText("User Authentication");
    fireEvent.click(storyOption);

    const principleSelect = screen.getByText("All Principles");
    fireEvent.click(principleSelect);

    const principleOption = screen.getByText("Independent");
    fireEvent.click(principleOption);
  });

  it("handles API errors gracefully", async () => {
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.reject(new Error("API Error"));
    });

    render(<AdminMonitoringPage />);

    const mockDataSwitch = screen.getByRole("switch", { name: "Use Mock Data" });
    fireEvent.click(mockDataSwitch);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to fetch data. Please try again or use mock data.")
      ).toBeInTheDocument();
    });

    expect(mockDataSwitch).toBeChecked();
  });
});
