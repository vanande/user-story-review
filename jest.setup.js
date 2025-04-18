// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom"

// Mock environment variables
process.env.DATABASE_URL = "postgres://postgres:password@localhost:5432/reviewdb_test"

// Mock console methods to keep test output clean
global.console = {
  ...console,
  // Uncomment to suppress specific console methods during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
}
