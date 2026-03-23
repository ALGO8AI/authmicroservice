import { describe, expect, it } from "@jest/globals";
import { generateHashPassword, isPasswordCorrect } from "../../../src/utils/password.js";

describe("password utils", () => {
  it("hashes a password and verifies it", async () => {
    const hash = await generateHashPassword("MyPassword123");

    expect(hash).not.toBe("MyPassword123");
    await expect(isPasswordCorrect("MyPassword123", hash)).resolves.toBe(true);
    await expect(isPasswordCorrect("wrong", hash)).resolves.toBe(false);
  });
});
