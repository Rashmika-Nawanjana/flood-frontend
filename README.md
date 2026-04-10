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
