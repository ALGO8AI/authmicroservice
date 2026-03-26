# Rollback Guide

## Trigger Conditions

Rollback should be initiated when a release causes one or more of the following:

- Smoke test failure after deployment
- Repeated 5xx errors or startup failures
- Authentication or authorization regression
- Critical config error that cannot be corrected safely in place

## Identify The Rollback Target

Use the last known good deployment record:

- Git tag, commit SHA, or release branch
- Previous deployment timestamp
- Previous config version if config is managed separately

Record the exact target before taking rollback action.

## Backend Rollback Steps

1. Stop further rollout activity.
2. Redeploy the last known good commit/tag using the same deployment path used for the failed release.
3. Reapply the last known good environment/config values if config changed with the release.
4. Restart the backend process using the standard process manager or host command.
5. Run the smoke test and check logs before declaring rollback complete.

## Config Rollback

- Revert only the config values introduced by the failed release.
- Confirm secrets, callback URLs, CORS origins, and feature toggles match the last known good state.
- If config is stored outside the repo, reference the environment change record as part of rollback.

## Database Caution

- This repository does not include a formal production migration framework.
- `npm run init-db` uses Sequelize sync behavior for non-production and must not be treated as a production rollback mechanism.
- If a release includes DB changes, rollback is only safe when the schema/data change is backward compatible or an explicit rollback script has been prepared and reviewed in advance.

## Post-Rollback Verification

- Run the smoke test against the rolled-back service.
- Check application logs for startup and runtime errors.
- Confirm the affected user path is working again.
- Record the failed release commit and rollback target in the incident or release log.
