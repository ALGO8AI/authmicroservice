import process from "process";

const DEFAULT_PATH = "/api/v1/healthcheck";
const DEFAULT_TIMEOUT_MS = 10_000;

function parseArgs(argv) {
  return argv.reduce((options, arg) => {
    if (!arg.startsWith("--")) {
      return options;
    }

    const [rawKey, rawValue] = arg.slice(2).split("=");
    options[rawKey] = rawValue ?? "true";
    return options;
  }, {});
}

function joinUrl(baseUrl, endpointPath) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = endpointPath.startsWith("/")
    ? endpointPath
    : `/${endpointPath}`;

  return `${normalizedBase}${normalizedPath}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = args.url ?? process.env.SMOKE_BASE_URL;
  const healthPath = args.path ?? process.env.SMOKE_HEALTH_PATH ?? DEFAULT_PATH;
  const timeoutMs = Number(
    args.timeout ?? process.env.SMOKE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS,
  );

  if (!baseUrl) {
    throw new Error("Base URL is required. Use --url or SMOKE_BASE_URL.");
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("Timeout must be a positive number.");
  }

  const healthUrl = joinUrl(baseUrl, healthPath);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        `Smoke test failed with HTTP ${response.status} for ${healthUrl}.`,
      );
    }

    if (!payload?.success || payload?.statusCode !== 200) {
      throw new Error(
        `Smoke test expected success=true and statusCode=200 at ${healthUrl}.`,
      );
    }

    if (payload?.data?.db !== "ok") {
      throw new Error(
        `Smoke test expected data.db to be "ok" at ${healthUrl}. Received "${payload?.data?.db}".`,
      );
    }

    console.log(
      `Smoke test passed: ${healthUrl} responded healthy for version ${payload?.data?.version ?? "unknown"}.`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
