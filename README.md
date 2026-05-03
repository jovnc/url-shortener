# URL Shortener

Singpass-verified URL shortener built with Next.js, NestJS, PostgreSQL, Redis, Prisma, and MockPass.

## Features

- MockPass/Singpass login with HTTP-only session cookies.
- Authenticated dashboard for creating, listing, copying, QR-sharing, expiring, and disabling links.
- Public short-link redirects with Redis-backed lookup caching.
- Custom aliases, reserved-word checks, expiry support, and link status display.
- Local Docker Compose services for PostgreSQL, Redis, and MockPass.

## Local Quick Start

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
docker compose up -d
pnpm be db:migrate:deploy
pnpm dev
```

Open `http://localhost:3000` for the app. The backend runs on `http://localhost:3001`, MockPass on `http://localhost:5156`, and dev Swagger docs on `http://localhost:3001/api`.

## Cloud Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Railway deployment steps.
