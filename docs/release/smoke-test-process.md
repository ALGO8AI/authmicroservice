# Smoke Test Process

Script: `npm run smoke:test -- --url=http://127.0.0.1:8080`

## What It Validates

- The backend is reachable over HTTP(S).
- `GET /api/v1/healthcheck` returns a success response.
- The health payload indicates the database check is healthy.

## What It Does Not Validate

- Full authentication flows
- OAuth callbacks
- File uploads
- End-to-end user journeys
- Performance characteristics

## Inputs

- `--url` or `SMOKE_BASE_URL`: base URL of the deployed service
- `--path` or `SMOKE_HEALTH_PATH`: health endpoint path. Defaults to `/api/v1/healthcheck`
- `--timeout` or `SMOKE_TIMEOUT_MS`: request timeout in milliseconds. Defaults to `10000`

## Usage

```bash
npm run smoke:test -- --url=http://127.0.0.1:8080
```

The script exits non-zero on failure so it can be used in deployment automation.

## Operational Guidance

- Run after every dev deployment.
- Run after production deployment before closing the release.
- If the smoke test fails, inspect logs immediately and decide whether to fix forward or execute rollback.
