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
