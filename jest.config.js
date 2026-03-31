// jest.config.js
module.exports = {
    testEnvironment: "jest-environment-jsdom",

    // Tell Jest to run this setup file before each test
    setupFilesAfterEnv: ["<rootDir>/setupJest.ts"],

    // Handle TypeScript files
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
    },

    // Mock static assets (CSS, SCSS, images)
    moduleNameMapper: {
        "\\.(css|scss|sass)$": "identity-obj-proxy",
    },

    // Optional: where Jest should look for tests
    testMatch: [
        "<rootDir>/src/**/*.test.{js,jsx,ts,tsx}",
        "<rootDir>/src/**/*.spec.{js,jsx,ts,tsx}",
    ],
};