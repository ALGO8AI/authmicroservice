# Deployment Guide

This guide covers Docker-based deployment for the Auth Microservice.

## Recommended Production Pattern

The standard deployment model for this repository is:

1. GitHub Actions builds a Docker image from `Dockerfile`
2. The image is pushed to GitHub Container Registry
3. The target host pulls the image and runs it with `docker compose`
4. A smoke test verifies `/api/v1/healthcheck`

## Required Runtime Configuration

The container expects the same environment variables as the non-container application runtime:

- `NODE_ENV`
- `PORT`
- `DB_NAME`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `SESSION_SECRET`
- `CORS_ORIGIN`
- mail and OAuth settings as required by your environment

Store these values in a host-managed env file and point `APP_ENV_FILE` at it in the GitHub Environment variables.

## Docker Artifacts In This Repository

- `Dockerfile`: production application image
- `docker-compose.deploy.yml`: host-side deployment compose file
- `.dockerignore`: image build context exclusions

## Host Requirements

The deployment host must have:

- Docker installed
- Docker Compose v2 available as `docker compose`
- an env file with runtime secrets already present on disk
- network access to the MySQL database
- access to pull the private image from GHCR if the package is private

## Compose Deployment Model

`docker-compose.deploy.yml` runs a single backend container and mounts a named volume for `/app/uploads`.

The compose file expects these substitution variables:

- `AUTH_IMAGE`
- `APP_ENV_FILE`
- `CONTAINER_NAME` optional
- `HOST_PORT` optional
- `APP_NODE_ENV` optional

These values are generated and passed by the GitHub Actions deployment workflow.

## Health Check

The image includes a Docker health check that probes:

- `GET /api/v1/healthcheck`

The GitHub Actions workflow also runs the repository smoke test after deployment.

## Database Caution

This repository still uses `npm run init-db` for non-production-friendly schema sync behavior. If you enable `DEPLOY_RUN_INIT_DB=true`, it runs in a one-off container before the compose rollout. Treat this as a controlled exception, not a default production migration strategy.

## Further Setup

See these files for operational setup:

- `docs/process/github-actions-deployment.md`
- `docs/process/environment-management.md`
- `.github/workflows/deployment-skeleton.yml`
