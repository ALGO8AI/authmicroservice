# Environment Management

## Standard Model

This repository uses environment variables for runtime configuration. The application is not branch-aware. Branch-to-environment mapping belongs in deployment automation and hosting configuration.

- `develop` deploys to the `development` environment
- `main` or `production` deploys to the `production` environment

The deployed host or CI/CD system provides the correct variables for that environment.

## Local File Conventions

For local development and local environment simulation, the repository supports these files:

- `.env`
- `.env.local`
- `.env.development`
- `.env.development.local`
- `.env.production`
- `.env.production.local`
- `.env.test`
- `.env.test.local`

Only sample files should be committed:

- `.env.sample`
- `.env.development.sample`
- `.env.production.sample`

Real env files stay untracked.

## Load Order

At startup, [load-env.js](C:/Algo8/Authorization-Microservice/authmicroservice/src/config/load-env.js) loads files in this order:

1. `.env.<NODE_ENV>.local`
2. `.env.local` except when `NODE_ENV=test`
3. `.env.<NODE_ENV>`
4. `.env`

Values already present in the process environment are not overridden. This keeps deployed secrets authoritative while still allowing local files to fill missing values.

## Recommended Usage

### Local development

Use:

- `.env.development` for shared local defaults
- `.env.local` or `.env.development.local` for machine-specific secrets

### Production

Do not rely on `.env.production` on the server unless your host explicitly uses file-based env management. Prefer host-injected variables, secret stores, or CI/CD environment secrets.

## GitHub Environments

Recommended GitHub setup:

1. Create a `development` environment.
2. Create a `production` environment.
3. Store environment-specific secrets and variables in each GitHub Environment.
4. In deployment workflows, map branches to environments:
   - `develop` -> `development`
   - `main` or `production` -> `production`
5. Use the deployment workflow defined in `.github/workflows/deployment-skeleton.yml`.

## Operational Rule

- Code stays the same across environments.
- Secrets and host-specific config differ by environment.
- Branches influence deployment target through CI/CD only.
