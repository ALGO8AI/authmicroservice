import { describe, expect, it, jest } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../helpers/http.helper.js";

const mockLoggerError = jest.fn();

await jest.unstable_mockModule("../../../src/logger/winston.logger.js", () => ({
  default: {
    error: mockLoggerError,
  },
}));

const { uploadFile } = await import("../../../src/controllers/upload.controller.js");

describe("upload controller", () => {
  it("rejects missing files", async () => {
    const res = createMockResponse();

    await uploadFile(createMockRequest(), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "No file uploaded." }));
  });

  it("returns a sanitized file payload", async () => {
    const req = createMockRequest({
      file: {
        originalname: "report.csv",
        filename: "report-123.csv",
        mimetype: "text/csv",
        size: 42,
        path: "secret-path",
      },
    });
    const res = createMockResponse();

    await uploadFile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          file: {
            originalname: "report.csv",
            filename: "report-123.csv",
            mimetype: "text/csv",
            size: 42,
          },
        },
      }),
    );
  });

  it("logs and returns 500 when reading req.file throws", async () => {
    const req = createMockRequest();
    Object.defineProperty(req, "file", {
      get() {
        throw new Error("filesystem error");
      },
    });
    const res = createMockResponse();

    await uploadFile(req, res);

    expect(mockLoggerError).toHaveBeenCalledWith("File upload failed:", expect.any(Error));
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
