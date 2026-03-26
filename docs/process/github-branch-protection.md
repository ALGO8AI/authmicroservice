# GitHub Branch Protection Setup

Use this after the repository files in this change are merged.

## Branches To Protect

Enable branch protection for:

- `main` or `production`
- `develop` if the team uses a staging integration branch

## Required Status Checks

Mark this GitHub Actions check as required:

- `Pull Request Checks / lint-and-unit-tests`

This comes from:

- Workflow name: `Pull Request Checks`
- Job name: `lint-and-unit-tests`

## Recommended Protection Settings

1. Require a pull request before merging.
2. Require approvals: 1 reviewer minimum for normal backend changes.
3. Require 2 reviewers for auth, DB, security, or release changes.
4. Dismiss stale approvals when new commits are pushed.
5. Require status checks to pass before merging.
6. Require branches to be up to date before merging.
7. Block force pushes.
8. Block branch deletion.

## Merge Policy

- Prefer squash merge for standard feature and bugfix branches.
- Allow merge commits only if your release process needs preserved branch history.
- Restrict direct merges to repository maintainers.

## Environment Protections

If GitHub Environments are used for deployment pipelines, configure:

- `development`: optional reviewer gate
- `production`: required reviewer gate and restricted deploy permissions

## Maintainer Verification

1. Open a test PR to `develop` or `main`.
2. Confirm the `Pull Request Checks / lint-and-unit-tests` status appears.
3. Confirm merge is blocked until the check passes and approvals are present.
