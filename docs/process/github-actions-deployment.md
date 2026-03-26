# GitHub Actions Deployment Setup

Workflow: `.github/workflows/deployment-skeleton.yml`

## What It Does

This workflow is Docker-first.

- `develop` deploys to the GitHub Environment `development`
- `main` and `production` deploy to the GitHub Environment `production`
- GitHub Actions builds a Docker image from `Dockerfile`
- The image is pushed to GitHub Container Registry
- The target host pulls the image and rolls it out with `docker compose`
- A smoke test runs after deployment

## Deployment Flow

1. Resolve the target environment from the pushed branch.
2. Run `npm ci`, lint, and unit tests in GitHub Actions.
3. Build and push the application image to GHCR.
4. Copy `docker-compose.deploy.yml` to the target host.
5. Log in to GHCR on the host and pull the new image.
6. Optionally run `npm run init-db` inside a one-off container when `DEPLOY_RUN_INIT_DB=true`.
7. Run `docker compose up -d --remove-orphans` on the host.
8. Run the smoke test against the deployed service.

## Required GitHub Environments

Create these GitHub Environments:

- `development`
- `production`

## Required Environment Secrets

Add these secrets in each GitHub Environment:

- `DEPLOY_HOST`: target server hostname or IP
- `DEPLOY_PORT`: SSH port, usually `22`
- `DEPLOY_USER`: SSH user for deployment
- `DEPLOY_SSH_KEY`: private SSH key allowed to access the deployment host
- `REGISTRY_USERNAME`: GHCR username with package read access on the deployment host
- `REGISTRY_PASSWORD`: GHCR token with package read access on the deployment host

## Required Environment Variables

Add these variables in each GitHub Environment:

- `DEPLOY_WORKDIR`: absolute directory on the host where the compose file and deployment env file should live
- `APP_ENV_FILE`: absolute path to the runtime env file used by the container on the host
- `DEPLOY_SMOKE_URL`: base URL to verify after deploy, for example `https://dev-api.example.com`

## Optional Environment Variables

- `DEPLOY_SMOKE_PATH`: defaults to `/api/v1/healthcheck`
- `CONTAINER_NAME`: defaults to `auth-microservice`
- `HOST_PORT`: defaults to `8080`
- `DEPLOY_RUN_INIT_DB`: set to `true` only when the environment should run `npm run init-db` inside the image before compose rollout

## Host Assumptions

The target server must already have:

- Docker installed
- Docker Compose v2 available as `docker compose`
- a runtime env file present at `APP_ENV_FILE`
- network reachability from the container to the target MySQL instance
- permission for the deployment SSH user to run Docker commands

The host does not need Node.js, npm, or a checked-out copy of the repository for the deployment workflow.

## Important Cautions

- Do not enable `DEPLOY_RUN_INIT_DB=true` for production unless you explicitly accept the current `init-db` behavior.
- This workflow deploys a single backend container and assumes MySQL is managed outside the application container.
- Protect the `production` GitHub Environment with required reviewers.
