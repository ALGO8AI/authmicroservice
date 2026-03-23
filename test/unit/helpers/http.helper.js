import { jest } from "@jest/globals";

export const createMockRequest = (overrides = {}) => {
  const headers = Object.fromEntries(
    Object.entries(overrides.headers || {}).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ]),
  );

  const req = {
    body: {},
    params: {},
    query: {},
    cookies: {},
    headers,
    session: {},
    protocol: "http",
    method: "GET",
    url: "/test",
    ip: "127.0.0.1",
    user: undefined,
    file: undefined,
    ...overrides,
  };

  req.header =
    overrides.header ||
    jest.fn((name) => headers[name.toLowerCase()] ?? undefined);
  req.get =
    overrides.get || jest.fn((name) => headers[name.toLowerCase()] ?? undefined);

  return req;
};

export const createMockResponse = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
    end: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    setHeader: jest.fn(),
    redirect: jest.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  res.send.mockReturnValue(res);
  res.end.mockReturnValue(res);
  res.cookie.mockReturnValue(res);
  res.clearCookie.mockReturnValue(res);
  res.setHeader.mockReturnValue(res);
  res.redirect.mockReturnValue(res);

  return res;
};

export const createMockNext = () => jest.fn();

export const flushPromises = async () => {
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
};

export const executeHandler = async (
  handler,
  req = createMockRequest(),
  res = createMockResponse(),
  next = createMockNext(),
) => {
  const result = handler(req, res, next);
  await Promise.resolve(result);
  await flushPromises();
  return { req, res, next, result };
};
