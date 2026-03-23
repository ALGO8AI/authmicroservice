import { describe, expect, it, jest } from "@jest/globals";

const mockHash = jest.fn();
const mockCompare = jest.fn();
const mockRandomInt = jest.fn();

await jest.unstable_mockModule("crypto", () => ({
  default: {
    randomInt: mockRandomInt,
  },
}));

await jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: mockHash,
    compare: mockCompare,
  },
}));

const { generateOtp, verifyOtp } = await import("../../../src/utils/otp.js");

describe("otp utils", () => {
  it("generates hashed otp metadata", async () => {
    mockRandomInt.mockReturnValue(123456);
    mockHash.mockResolvedValue("hashed-otp");

    const result = await generateOtp();

    expect(result.otp).toBe(123456);
    expect(result.hashedOtp).toBe("hashed-otp");
    expect(result.generationTime).toBeInstanceOf(Date);
    expect(mockHash).toHaveBeenCalledWith("123456", 10);
  });

  it("returns false when otp has expired", async () => {
    const past = new Date(Date.now() - 6 * 60 * 1000).toISOString();

    const result = await verifyOtp(
      { hashedOtp: "hashed", generationTime: past },
      "123456",
    );

    expect(result).toBe(false);
    expect(mockCompare).not.toHaveBeenCalled();
  });

  it("compares the supplied otp when still valid", async () => {
    mockCompare.mockResolvedValue(true);

    const result = await verifyOtp(
      { hashedOtp: "hashed", generationTime: new Date().toISOString() },
      123456,
    );

    expect(result).toBe(true);
    expect(mockCompare).toHaveBeenCalledWith("123456", "hashed");
  });
});
