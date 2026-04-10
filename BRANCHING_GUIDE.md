# Branching Guide

This document describes the Git branching model for this repository and provides one-time alignment steps to synchronise all long-lived branches.

## Branch Structure

```
main   ← production (stable releases)
 ↑
stg    ← staging (pre-production testing)
 ↑
dev    ← development (integration branch)
 ↑
feature/<name> / fix/<name> / chore/<name>  ← your work
```

## Protected Branches

| Branch | Purpose            | Who merges      |
|--------|--------------------|-----------------|
| `main` | Production         | Leads/admins    |
| `stg`  | Staging            | Leads/admins    |
| `dev`  | Development        | Any contributor via PR |

**Never push directly to `main`, `stg`, or `dev`.**

## How to Create a Branch

Always start from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/my-feature
```

GitHub will automatically suggest **"Compare & pull request"** into `dev` when
you push this branch, because it was created from `dev`.

## Pull Request Flow

| PR Direction          | Triggered by    |
|-----------------------|-----------------|
| `feature/*` → `dev`  | Contributors    |
| `dev` → `stg`         | Leads/admins    |
| `stg` → `main`        | Leads/admins    |

## Why GitHub Suggests the Correct Base Branch

GitHub suggests the parent branch (the branch you created from) as the
PR base. To get the correct suggestions:

- Create feature branches **from `dev`** → PR target will be `dev`
- Merge `dev` → `stg` → PR promotes dev changes to staging
- Merge `stg` → `main` → PR promotes staging changes to production

## Branch Naming

| Prefix        | Use for                        |
|---------------|--------------------------------|
| `feature/`    | New features                   |
| `fix/`        | Bug fixes                      |
| `chore/`      | Tooling, configs, documentation|
| `refactor/`   | Code cleanup                   |
| `hotfix/`     | Urgent production fixes        |

## Quick Start

```bash
# 1. Get latest dev
git checkout dev
git pull origin dev

# 2. Create your branch
git checkout -b feature/my-task

# 3. Work, commit (follow commit message rules), push
git add .
git commit -m "feat: my task description"
git push -u origin feature/my-task

# 4. Open a PR on GitHub → target is dev (auto-suggested)
```

See `gitworkflow.md` for the full workflow including commit message rules and
Git hook setup.

---

## One-Time Branch Alignment (Post-PR Steps)

After the PR `copilot/align-branches-to-fix-gitworkflow` is merged into `main`,
run these steps to propagate the same content to `stg` and `dev`.

### Step 1 – Merge `main` into `stg`

On GitHub, open a pull request:

- **base**: `stg`
- **compare**: `main`

Title: `chore: align stg with main (branch sync)`

Merge it. `stg` will now have the same content as `main`.

### Step 2 – Merge `stg` into `dev`

Open another pull request:

- **base**: `dev`
- **compare**: `stg`

Title: `chore: align dev with stg (branch sync)`

Merge it. `dev` will now have the same content as `main` and `stg`.

> **Note**: If `dev` already has commits ahead of `stg`, this merge may be a no-op
> for those files. Resolve any conflicts by keeping the `dev` version of those files.

### Step 3 – Delete `fix/gitworkflow`

After all merges are complete and no open PRs depend on `fix/gitworkflow`:

```bash
# Via GitHub CLI
gh api -X DELETE repos/YOUR_ORG/YOUR_REPO/git/refs/heads/fix%2Fgitworkflow

# Or via GitHub web UI:
# 1. Go to https://github.com/YOUR_ORG/YOUR_REPO/branches
# 2. Find fix/gitworkflow in the list
# 3. Click the trash icon to delete it
```

---
