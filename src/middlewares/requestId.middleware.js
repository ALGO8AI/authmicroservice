import { randomUUID } from "crypto";

// UUID v4 pattern — the only format we accept from callers.
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Attaches a unique request ID to each incoming request.
 * If the caller supplies an `X-Request-Id` header it must be a valid UUID v4
 * (max 36 chars, no control characters); otherwise a new UUID is generated.
 * The ID is set on `req.requestId` and echoed back in the `X-Request-Id` response header.
 */
export const requestId = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  let id;

  if (
    incoming &&
    incoming.length <= 36 &&
    !/[\r\n]/.test(incoming) &&
    UUID_REGEX.test(incoming)
  ) {
    id = incoming;
  } else {
    id = randomUUID();
  }

  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
};
