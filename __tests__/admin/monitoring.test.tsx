import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import AdminMonitoringPage from "@/app/admin/monitoring/page"
import { mockUserStories, mockPrinciples, mockActiveReviews } from "@/lib/mock-data"

// Mock the fetch function
global.fetch = jest.fn()

// Mock the chart.js components
jest.mock("react-chartjs-2", () => ({
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Pie: () => <div data-testid="pie-chart">Pie Chart</div>,
}))

describe("Admin Monitoring Page", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful fetch responses
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/admin/stories")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUserStories }),
        })
      } else if (url.includes("/api/admin/principles")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockPrinciples }),
        })
      } else if (url.includes("/api/admin/active-reviews")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockActiveReviews }),
        })
      } else if (url.includes("/api/admin/stats/principles")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      } else if (url.includes("/api/admin/stats/stories")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
      return Promise.reject(new Error("Not found"))
    })
  })

  it("renders the monitoring dashboard with mock data", () => {
    render(<AdminMonitoringPage />)

    // Check for main heading
    expect(screen.getByText("Review Monitoring Dashboard")).toBeInTheDocument()

    // Check for mock data toggle
    expect(screen.getByText("Use Mock Data")).toBeInTheDocument()

    // Check for active reviews section
    expect(screen.getByText("Active Reviews")).toBeInTheDocument()

    // Check for charts
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument()
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument()
  })

  it("toggles between mock and real data", async () => {
    render(<AdminMonitoringPage />)

    // Initially using mock data
    const mockDataSwitch = screen.getByRole("switch", { name: "Use Mock Data" })
    expect(mockDataSwitch).toBeChecked()

    // Toggle to real data
    fireEvent.click(mockDataSwitch)

    // Should trigger API calls
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(5)
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/stories")
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/principles")
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/active-reviews")
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/stats/principles")
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/stats/stories")
    })
  })

  it("handles filter changes", () => {
    render(<AdminMonitoringPage />)

    // Find and click the story select
    const storySelect = screen.getByText("All Stories")
    fireEvent.click(storySelect)

    // Select a specific story
    const storyOption = screen.getByText("User Authentication")
    fireEvent.click(storyOption)

    // Find and click the principle select
    const principleSelect = screen.getByText("All Principles")
    fireEvent.click(principleSelect)

    // Select a specific principle
    const principleOption = screen.getByText("Independent")
    fireEvent.click(principleOption)
  })

  it("handles API errors gracefully", async () => {
    // Mock a failed fetch
    ;(global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.reject(new Error("API Error"))
    })

    render(<AdminMonitoringPage />)

    // Toggle to real data to trigger API call
    const mockDataSwitch = screen.getByRole("switch", { name: "Use Mock Data" })
    fireEvent.click(mockDataSwitch)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch data. Please try again or use mock data.")).toBeInTheDocument()
    })

    // Should revert to mock data
    expect(mockDataSwitch).toBeChecked()
  })
})
