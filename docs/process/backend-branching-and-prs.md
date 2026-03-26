# Backend Branching And PR Workflow

## Branch Strategy

- `main` or `production`: production-ready code only.
- `develop`: integration branch for the next release when the team uses one.
- Short-lived branches are required for all delivery work.

## Branch Naming

- Feature work: `feature/<ticket>-<short-description>`
- Bug fixes: `bugfix/<ticket>-<short-description>`
- Hotfixes: `hotfix/<ticket>-<short-description>`
- Chores/process work: `chore/<ticket>-<short-description>`

Use lowercase words and hyphens only. Keep branch names traceable to the ticket or requirement.

## Pull Request Expectations

- Open PRs against `develop` when the team is batching changes for a release.
- Open PRs against `main` or `production` only for approved releases or hotfixes.
- Rebase or merge from the target branch before requesting final review if the branch is stale.
- Use the repository PR template and complete every operational section.

## Merge Rules

- No direct pushes to protected branches.
- CI must pass before merge.
- At least 1 reviewer approval is required for normal changes.
- At least 2 reviewer approvals are recommended for auth, security, DB, or production-affecting changes.
- Resolve all review comments or explicitly document why they are deferred.

## Required Pre-Merge Checks

- `Pull Request Checks / lint-and-unit-tests`
- Local verification for any changed backend behavior
- Explicit note for DB/config/deployment impact
