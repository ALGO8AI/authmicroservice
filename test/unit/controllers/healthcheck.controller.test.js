import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createMockNext, createMockRequest, createMockResponse, executeHandler } from "../helpers/http.helper.js";

const mockAuthenticate = jest.fn();

await jest.unstable_mockModule("../../../src/config/db.js", () => ({
  default: {
    authenticate: mockAuthenticate,
  },
}));

const { healthcheck } = await import("../../../src/controllers/healthcheck.controller.js");

describe("healthcheck controller", () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
  });

  it("returns 200 when the database is reachable", async () => {
    const res = createMockResponse();
    mockAuthenticate.mockResolvedValue(undefined);

    await executeHandler(healthcheck, createMockRequest(), res, createMockNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 200,
        data: expect.objectContaining({ db: "ok", version: "1.0.0" }),
      }),
    );
  });

  it("returns 503 when the database check fails", async () => {
    const res = createMockResponse();
    mockAuthenticate.mockRejectedValue(new Error("offline"));

    await executeHandler(healthcheck, createMockRequest(), res, createMockNext());

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ db: "error" }) }),
    );
  });
});
