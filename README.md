# Flood Frontend

Minimal Flutter skeleton to unblock parallel development.

## Structure

- `lib/main.dart`: app entrypoint
- `lib/screens/home.dart`: starter screen
- `lib/services/api.dart`: API endpoint placeholders for envs

## First-time setup

If this folder does not have platform directories yet, initialize them once:

```bash
flutter create .
```

Then restore dependencies and run:

```bash
flutter pub get
flutter run
```

## Environment URL contract

- DEV: `http://localhost:8000`
- STAGING: `https://api-stg.example.com`
- PROD: `https://api.example.com`

## Enforced commit message format

This repository blocks commits that do not follow the agreed structure.

Format:

```text
type(scope optional): short description
```

Example:

```text
fix: add githooks and branch protection
```

Setup once after cloning:

```bash
bash scripts/setup-git-hooks.sh
```

## Branch protection setup (GitHub)

Apply protection for `main`, `stg`, and `dev` (PR required, admin enforcement, no force push):

```bash
bash scripts/apply-branch-protection.sh
```

Prerequisites:

- Install GitHub CLI (`gh`)
- Authenticate once with `gh auth login`

## Git workflow for new contributors

Read this before your first commit.

### Protected branches

- `main`, `stg`, and `dev` are protected.
- Do not work directly on these branches.
- Direct push to these branches is blocked by GitHub.

### Always create a new branch for your task

Use one of these branch types:

- `feature/<short-name>` for new work
- `fix/<short-name>` for bug fixes
- `chore/<short-name>` for tooling/docs/maintenance

Example:

```bash
git checkout dev
git pull
git checkout -b feature/add-flood-dashboard
```

### Commit message structure

Required format:

```text
type(scope optional): short description
```

Good examples:

```text
fix: add githooks and branch protection
feat(ui): add flood dashboard screen
chore(ci): add staging pipeline step
```

### How to submit changes (dev first)

All work must be merged to `dev` first.

1. Push your branch:

```bash
git push -u origin feature/add-flood-dashboard
```

2. Open a Pull Request into `dev`.
3. After review and checks pass, merge into `dev`.
4. Promotion happens later as:
	- `dev` -> `stg`
	- `stg` -> `main`

### Fast command checklist

```bash
bash scripts/setup-git-hooks.sh
git checkout dev
git pull
git checkout -b feature/my-task
git add .
git commit -m "feat: short message"
git push -u origin feature/my-task
```
