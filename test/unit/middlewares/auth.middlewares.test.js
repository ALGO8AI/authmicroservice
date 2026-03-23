import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ApiError } from "../../../src/utils/ApiError.js";
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
} from "../helpers/http.helper.js";

const mockFindById = jest.fn();
const mockVerify = jest.fn();

await jest.unstable_mockModule("../../../src/queries/auth.queries.js", () => ({
  default: {
    findById: mockFindById,
  },
  EXCLUDED_FIELDS: ["password", "refreshToken"],
}));

await jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    verify: mockVerify,
  },
}));

const { verifyJWT, verifyPermission } = await import(
  "../../../src/middlewares/auth.middlewares.js"
);

describe("auth middlewares", () => {
  beforeEach(() => {
    mockFindById.mockReset();
    mockVerify.mockReset();
  });

  describe("verifyJWT", () => {
    it("authenticates with cookie token and attaches the user", async () => {
      const req = createMockRequest({ cookies: { accessToken: "token-1" } });
      const res = createMockResponse();
      const next = createMockNext();
      const user = { toJSON: () => ({ userId: "u1", roleId: "USER" }) };

      mockVerify.mockReturnValue({ userId: "u1" });
      mockFindById.mockResolvedValue(user);

      await verifyJWT(req, res, next);

      expect(mockVerify).toHaveBeenCalledWith("token-1", "test-access-secret");
      expect(req.user).toEqual({ userId: "u1", roleId: "USER" });
      expect(next).toHaveBeenCalledWith();
    });

    it("falls back to the Authorization header", async () => {
      const req = createMockRequest({
        headers: { Authorization: "Bearer token-2" },
      });
      const next = createMockNext();

      mockVerify.mockReturnValue({ userId: "u2" });
      mockFindById.mockResolvedValue({ toJSON: () => ({ userId: "u2" }) });

      await verifyJWT(req, createMockResponse(), next);

      expect(mockVerify).toHaveBeenCalledWith("token-2", "test-access-secret");
      expect(next).toHaveBeenCalledWith();
    });

    it("forwards unauthorized requests when no token is provided", async () => {
      const next = createMockNext();

      await verifyJWT(createMockRequest(), createMockResponse(), next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].message).toBe("Unauthorized request");
    });

    it("forwards invalid token errors", async () => {
      const next = createMockNext();
      mockVerify.mockImplementation(() => {
        throw new Error("jwt malformed");
      });

      await verifyJWT(
        createMockRequest({ cookies: { accessToken: "bad-token" } }),
        createMockResponse(),
        next,
      );

      expect(next.mock.calls[0][0]).toEqual(expect.any(ApiError));
      expect(next.mock.calls[0][0].message).toBe("jwt malformed");
    });

    it("rejects requests when the decoded user no longer exists", async () => {
      const next = createMockNext();
      mockVerify.mockReturnValue({ userId: "missing" });
      mockFindById.mockResolvedValue(null);

      await verifyJWT(
        createMockRequest({ cookies: { accessToken: "token" } }),
        createMockResponse(),
        next,
      );

      expect(next.mock.calls[0][0].message).toBe("Invalid access token");
    });
  });

  describe("verifyPermission", () => {
    it("allows users with an accepted role", async () => {
      const next = createMockNext();

      await verifyPermission(["ADMIN", "USER"])(
        createMockRequest({ user: { userId: "u1", roleId: "USER" } }),
        createMockResponse(),
        next,
      );

      expect(next).toHaveBeenCalledWith();
    });

    it("rejects missing authenticated users", async () => {
      const next = createMockNext();

      await verifyPermission(["ADMIN"])(
        createMockRequest(),
        createMockResponse(),
        next,
      );

      expect(next.mock.calls[0][0].message).toBe("Unauthorized request");
    });

    it("rejects users without permission", async () => {
      const next = createMockNext();

      await verifyPermission(["ADMIN"])(
        createMockRequest({ user: { userId: "u1", roleId: "USER" } }),
        createMockResponse(),
        next,
      );

      expect(next.mock.calls[0][0].message).toBe(
        "You are not allowed to perform this action",
      );
    });
  });
});
