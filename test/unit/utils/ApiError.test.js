import { describe, expect, it } from "@jest/globals";
import { ApiError } from "../../../src/utils/ApiError.js";

describe("ApiError", () => {
  it("stores api error metadata", () => {
    const error = new ApiError(422, "Invalid input", [{ email: "required" }]);

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(422);
    expect(error.success).toBe(false);
    expect(error.errors).toEqual([{ email: "required" }]);
    expect(error.data).toBeNull();
  });

  it("serializes to a stable JSON payload", () => {
    const error = new ApiError(401, "Unauthorized");

    expect(error.toJSON()).toEqual({
      statusCode: 401,
      data: null,
      success: false,
      message: "Unauthorized",
      errors: [],
    });
  });
});
