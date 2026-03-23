import { describe, expect, it } from "@jest/globals";
import { ApiResponse } from "../../../src/utils/ApiResponse.js";

describe("ApiResponse", () => {
  it("marks successful responses correctly", () => {
    const response = new ApiResponse(200, { ok: true }, "Done");

    expect(response).toEqual({
      statusCode: 200,
      data: { ok: true },
      message: "Done",
      success: true,
    });
  });

  it("marks error responses as unsuccessful", () => {
    const response = new ApiResponse(404, null, "Missing");

    expect(response.success).toBe(false);
  });
});
