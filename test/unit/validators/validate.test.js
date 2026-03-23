import { describe, expect, it, jest } from "@jest/globals";

const mockValidationResult = jest.fn();

await jest.unstable_mockModule("express-validator", () => ({
  validationResult: mockValidationResult,
}));

const { validate } = await import("../../../src/validators/validate.js");

describe("validate middleware", () => {
  it("calls next when there are no validation errors", () => {
    const next = jest.fn();
    mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

    validate({}, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("throws an ApiError with structured validation failures", () => {
    mockValidationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [
        { path: "email", msg: "Email is invalid" },
        { path: "password", msg: "Password is required" },
      ],
    });

    expect(() => validate({}, {}, jest.fn())).toThrow("Received data is not valid");
  });
});
