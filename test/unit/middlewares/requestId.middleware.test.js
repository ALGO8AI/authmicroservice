import { describe, expect, it } from "@jest/globals";
import { requestId } from "../../../src/middlewares/requestId.middleware.js";
import { createMockRequest, createMockResponse, createMockNext } from "../helpers/http.helper.js";

describe("requestId middleware", () => {
  it("reuses a valid caller-supplied uuid", () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const req = createMockRequest({ headers: { "x-request-id": id } });
    const res = createMockResponse();
    const next = createMockNext();

    requestId(req, res, next);

    expect(req.requestId).toBe(id);
    expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", id);
    expect(next).toHaveBeenCalled();
  });

  it("generates a new uuid for invalid incoming values", () => {
    const req = createMockRequest({ headers: { "x-request-id": "bad\nvalue" } });
    const res = createMockResponse();

    requestId(req, res, createMockNext());

    expect(req.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", req.requestId);
  });
});
