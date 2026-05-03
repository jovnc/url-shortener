# URL Shortener

Singpass/MockPass-verified URL shortener built with Next.js, NestJS, PostgreSQL, Redis, Prisma, and Railway deployment support.

## Features

- MockPass/Singpass login with HTTP-only session cookies.
- Authenticated dashboard for creating, listing, copying, QR-sharing, expiring, and disabling links.
- Public short-link redirects through the frontend with backend redirect resolution.
- Redis-backed redirect lookup caching and Redis-backed Base62 short-code generation.
- Custom aliases, reserved-word checks, expiry support, and link status display.
- Local Docker Compose services for PostgreSQL, Redis, and MockPass.

## Repository Structure

- `apps/frontend`: Next.js 16 app, dashboard UI, API proxy routes, and public `/:code` redirect route.
- `apps/backend`: NestJS API, MockPass/Singpass auth, link management, redirects, health checks, and Prisma schema.
- `docker/mockpass`: MockPass Docker image used locally and in Railway.
- `docs`: Product and deployment documentation.

## Prerequisites

- Node.js 22.
- pnpm 10.33.0.
- Docker and Docker Compose.

## Local Quick Start

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local
docker compose up -d
pnpm be db:generate
pnpm be db:migrate:deploy
pnpm dev
```

`pnpm dev` also runs `docker compose up -d`, then starts the backend in watch mode and the frontend after the backend port is ready.

Local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Swagger: `http://localhost:3001/api`
- Health: `http://localhost:3001/api/v1/health`
- MockPass: `http://localhost:5156`
- Backend JWKS: `http://localhost:3001/.well-known/jwks.json`

## Product Behavior

- Authenticated users can create generated short codes or custom aliases.
- Generated short codes use a Redis `INCR` counter encoded as Base62 with a minimum length of 6.
- Custom aliases are validated by the backend as 3-50 letters, numbers, or hyphens, with reserved words blocked.
- Disabled links are soft-deactivated rather than deleted from PostgreSQL.
- Active redirect payloads are cached in Redis for up to 15 minutes, capped by link expiry.
- Expired or disabled links return `410 Gone`; unknown or malformed short codes return `404 Not Found`.
- Swagger is available only outside production.

Known limitation: the frontend public redirect route currently accepts alphanumeric short codes only, while the backend allows hyphens in custom aliases.

## Cloud Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Railway deployment steps.

## Product Notes

See [docs/PRD.md](docs/PRD.md) for current scope, architecture, known gaps, and future improvements.
