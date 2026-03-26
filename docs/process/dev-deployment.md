# Development Deployment Script

Script: `npm run deploy:dev`

## Purpose

This script remains available for manual, non-Docker host deployments of a checked-out revision of the backend. It installs dependencies, optionally initializes the database, performs an environment-specific restart command, and runs the smoke test.

## Current Recommendation

For shared development and production environments, use the Docker-based GitHub Actions deployment workflow instead of this script.

Use this script only when:

- you are deploying directly on a host without containers
- you are troubleshooting outside the standard Docker rollout path
- you need a temporary fallback deployment path

## What The Script Does

1. Verifies the working tree path exists.
2. Optionally syncs to a git ref if explicitly enabled.
3. Installs dependencies with `npm ci` when `package-lock.json` exists, otherwise `npm install`.
4. Optionally runs `npm run init-db`.
5. Optionally runs a restart command provided by the environment.
6. Runs the smoke test against the configured URL.

## Environment Variables

The script accepts both local `DEV_DEPLOY_*` variables and generic `DEPLOY_*` variables.

- `DEPLOY_WORKDIR` or `DEV_DEPLOY_WORKDIR`: repo path to deploy. Defaults to the current repo root.
- `DEPLOY_GIT_SYNC` or `DEV_DEPLOY_GIT_SYNC`: set to `true` to allow `git fetch --all --prune` and checkout.
- `DEPLOY_REF` or `DEV_DEPLOY_REF`: branch, tag, or commit to check out when git sync is enabled.
- `DEPLOY_RUN_INIT_DB` or `DEV_DEPLOY_RUN_INIT_DB`: set to `true` to run `npm run init-db`.
- `DEPLOY_RESTART_CMD` or `DEV_DEPLOY_RESTART_CMD`: process restart command. Example: `pm2 restart auth-microservice`.
- `DEPLOY_SMOKE_URL` or `DEV_DEPLOY_SMOKE_URL`: base URL used for post-deploy smoke validation. Example: `http://127.0.0.1:8080`.
- `DEPLOY_SMOKE_PATH` or `DEV_DEPLOY_SMOKE_PATH`: optional health path override. Defaults to `/api/v1/healthcheck`.

## CI/CD Usage

The standard CI/CD path is Docker-based and does not use this script. See `docs/process/github-actions-deployment.md` and `.github/workflows/deployment-skeleton.yml`.

## Limitations

- Git sync is optional because repository credentials and host policy vary by environment.
- Database initialization uses the existing `init-db` script, which relies on Sequelize sync behavior and is not suitable for production schema rollout.
- Restart behavior is intentionally parameterized because this fallback path does not prescribe an infrastructure runtime.
