import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import Sequelize from "sequelize";
import { ApiError } from "../../../src/utils/ApiError.js";
import { createMockRequest, createMockResponse } from "../helpers/http.helper.js";

const mockLoggerError = jest.fn();

await jest.unstable_mockModule("../../../src/logger/winston.logger.js", () => ({
  default: {
    error: mockLoggerError,
  },
}));

const { errorHandler } = await import(
  "../../../src/middlewares/error.middlewares.js"
);

describe("errorHandler", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    mockLoggerError.mockReset();
  });

  it("returns ApiError details directly in non-production", () => {
    const error = new ApiError(422, "Bad data", [{ field: "email" }]);
    const res = createMockResponse();
    const req = createMockRequest({ method: "POST", url: "/auth", requestId: "req-1" });

    errorHandler(error, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
        message: "Bad data",
        errors: [{ field: "email" }],
        stack: expect.any(String),
      }),
    );
    expect(mockLoggerError).toHaveBeenCalledWith(
      "Bad data",
      expect.objectContaining({ method: "POST", url: "/auth", requestId: "req-1" }),
    );
  });

  it("maps sequelize errors to 400", () => {
    const res = createMockResponse();

    errorHandler(
      new Sequelize.ValidationError("invalid"),
      createMockRequest(),
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("hides 500-level messages in production", () => {
    process.env.NODE_ENV = "production";
    const res = createMockResponse();

    errorHandler(new Error("db leaked"), createMockRequest(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: "Internal server error",
      errors: [],
    });
  });
});
