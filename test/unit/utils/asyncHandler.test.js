import { describe, expect, it, jest } from "@jest/globals";
import { asyncHandler } from "../../../src/utils/asyncHandler.js";

describe("asyncHandler", () => {
  it("calls the wrapped handler", async () => {
    const handler = jest.fn().mockResolvedValue("ok");
    const next = jest.fn();

    asyncHandler(handler)({}, {}, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(handler).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards rejected errors to next", async () => {
    const error = new Error("boom");
    const next = jest.fn();

    asyncHandler(async () => {
      throw error;
    })({}, {}, next);

    await new Promise((resolve) => setImmediate(resolve));
    expect(next).toHaveBeenCalledWith(error);
  });
});
