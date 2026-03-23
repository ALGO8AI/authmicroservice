import { afterEach, beforeEach, jest } from "@jest/globals";

beforeEach(() => {
  process.env.ACCESS_TOKEN_SECRET = "test-access-secret";
  process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
  process.env.ACCESS_TOKEN_EXPIRY = "15m";
  process.env.REFRESH_TOKEN_EXPIRY = "7d";
  process.env.NODE_ENV = "test";
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  delete global.fetch;
});
