/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    // ---- CHANGE THIS ----
    // Use 'jsdom' for React component testing environment (needed for JSX)
    testEnvironment: 'jsdom',
    // -------------------
    clearMocks: true,
    // Optional: Uncomment if you created jest.setup.js
    // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
            // ts-jest should handle basic JSX fine with 'jsdom' environment and correct tsconfig
        }],
    },

    // ---- ADD THIS SECTION ----
    // Map the '@/' alias from tsconfig.json paths
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    // ------------------------

    transformIgnorePatterns: [
        '/node_modules/',
        '\\.pnp\\.[^\\/]+$'
    ],
};