# Production Release Checklist

## Pre-Release

- [ ] Release branch/PR target is correct.
- [ ] Scope is approved and linked to tracked work.
- [ ] Release notes or operator notes are prepared.
- [ ] Last known good version, commit, or tag is recorded before deployment.

## Quality Gates

- [ ] PR approvals meet team policy.
- [ ] `Pull Request Checks / lint-and-unit-tests` is green.
- [ ] Any additional manual verification for changed endpoints is complete.

## DB And Config Review

- [ ] DB changes were reviewed explicitly.
- [ ] Migration or schema-change plan is documented.
- [ ] Rollback impact for DB changes is understood.
- [ ] Env/config changes were reviewed and approved.

## Deployment Readiness

- [ ] Deployment window and owner are confirmed.
- [ ] Access to deployment target and logs is verified.
- [ ] Smoke test URL and expected healthy response are known.
- [ ] Rollback owner and rollback command/path are prepared.

## Post-Deploy

- [ ] Smoke test completed successfully.
- [ ] Logs checked for startup/runtime errors.
- [ ] Release notes updated with deployed version/commit.
- [ ] Stakeholders notified if required.
