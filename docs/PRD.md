# URL Shortener Product Requirements

## Overview

Build a URL shortening service where link creation is tied to a Singpass-verified identity. Anyone can open a short link, but only authenticated users can create and manage links.

## Target Audience

- Singapore residents with Singpass access who need trusted short links.
- Public users who receive and open short links without signing in.

## Current Product Scope

### Authentication

- MockPass/Singpass OIDC login flow with PAR, PKCE, nonce/state validation, DPoP, and private-key JWT client authentication.
- Backend-issued JWT session stored in an HTTP-only cookie.
- `/api/v1/auth/login`, `/api/v1/auth/callback`, `/api/v1/auth/logout`, and `/api/v1/auth/me` endpoints.
- Users are upserted from OIDC claims and stored with Singpass `sub` plus optional display name.
- Public JWKS endpoint for MockPass client verification.

### Link Creation And Management

- Authenticated users can create short links from the dashboard.
- Link creation supports optional expiry presets and optional custom aliases.
- Custom aliases are 3-50 characters and restricted to letters, numbers, and hyphens at the API layer.
- Reserved aliases such as `api`, `auth`, `health`, `links`, `login`, `logout`, and `me` are blocked.
- Authenticated users can view their own links ordered by newest first.
- Authenticated users can disable their own links; disabled links stop redirecting and are hidden from sharing actions in the UI.
- Dashboard shows active, expired, and disabled states.
- Active links can be copied and displayed as QR codes.
- Disablement is soft-deactivation; disabled links remain in PostgreSQL and aliases remain occupied.

### Redirects

- Public short links are handled by the frontend dynamic route and proxied to the backend redirect endpoint.
- Backend redirects with HTTP `302` when the link is active and unexpired.
- Expired or disabled links return `410 Gone`.
- Unknown or malformed short codes return `404 Not Found`.
- Redirect responses set `Cache-Control: no-store`.

### Validation And Errors

- `originalUrl` must be an absolute `http` or `https` URL without leading or trailing whitespace.
- `originalUrl` is capped at 2048 characters.
- Expiry dates must be valid ISO-8601 timestamps in the future.
- Duplicate custom aliases return `409 Conflict`.
- Invalid request bodies return validation errors from NestJS.

### Platform And Operations

- Monorepo with Next.js frontend and NestJS backend.
- PostgreSQL stores users and links through Prisma migrations.
- Redis is used for redirect cache entries and the short-code counter.
- Short codes are generated from a Redis-backed Base62 counter with a minimum length of 6.
- Health check endpoint verifies PostgreSQL and Redis status.
- CORS is restricted to the configured frontend URL.
- Swagger/OpenAPI is available in non-production environments at `/api`.
- Docker Compose supports local PostgreSQL, Redis, and MockPass.
- Railway deployment is documented for frontend, backend, MockPass, PostgreSQL, and Redis services.

## Current Architecture

### Frontend

- Next.js application serving the landing page, dashboard, API proxy routes, and public short-link route.
- Frontend API routes proxy authenticated requests to the private backend service so browsers only need the frontend origin.

### Backend

- NestJS REST API under `/api/v1`.
- JWT guard protects authenticated auth and link-management endpoints.
- Redirect endpoint remains public.

### Data Store

- PostgreSQL is the source of truth.
- `users.sub` and `links.short_code` are unique.
- Links are indexed by owner and expiry.

### Cache And Counters

- Redis caches redirect payloads for up to 15 minutes, capped by link expiry.
- Redis `INCR` produces monotonically increasing short-code IDs encoded as Base62.
- Link disablement invalidates the redirect cache.
- Redis counter state must be preserved or reinitialized carefully when restoring data, because existing PostgreSQL links can conflict with newly generated codes if the counter is reset.

## Known Gaps

- Public frontend redirect validation currently accepts alphanumeric short codes only, while the backend permits hyphens in custom aliases. This affects hyphenated custom aliases and should be aligned before promoting them heavily.
- URL validation does not yet block private IP ranges, localhost, or internal hostnames.
- There is no rate limiting on create, auth, or redirect endpoints.
- There is no CSRF protection for cookie-authenticated state-changing requests.
- There is no edit flow for changing destination URL, expiry, or active status after creation.
- There is no permanent delete or reactivate flow.
- Disabled aliases are not permanently retired as a separate domain concept; they remain existing inactive link records.
- Click counts and analytics are not implemented, even though product surfaces may reference sharing and traffic concepts.
- Backend unit tests cover selected link-service, short-code generation, and JWT guard behavior. Auth callback tests, frontend tests, integration tests, end-to-end tests, and Redis/PostgreSQL-backed tests are still needed.

## Future Improvements

### High Priority

- Align frontend and backend short-code validation, including hyphenated aliases.
- Add SSRF-safe URL validation: block localhost, private IP ranges, link-local addresses, and internal hostnames.
- Add rate limiting for login, link creation, and redirect endpoints.
- Add automated tests for auth callback handling, link creation, redirect resolution, expiry, disablement, and cache behavior.
- Add CSRF protection for cookie-authenticated state-changing requests.

### Medium Priority

- Add link editing for destination URL, expiry, and active status.
- Add alias retirement rules so disabled/deleted custom aliases cannot be reused accidentally.
- Add structured error codes for frontend display and API consumers.
- Add production-safe security headers, including CSP.
- Add frontend, integration, and end-to-end test coverage for the main user journeys.

### Low Priority

- Add click counts and basic analytics.
- Add advanced analytics such as referrers, device type, and geolocation.
- Add malicious-link scanning or phishing-risk checks.
- Add bulk link creation and CSV export.
- Add teams or organization-level link ownership.
- Add non-Singpass auth methods only if there is a clear product need.

## Non-Functional Requirements

- Redirects should remain highly available because active short links depend on them.
- Redirect lookup should stay optimized for read-heavy traffic.
- Short-code generation must be concurrency-safe.
- Redis counter state must be treated as operational data and kept consistent with persisted links.
- The system should avoid storing unnecessary personal data; current storage is limited to Singpass `sub`, optional display name, and link ownership metadata.
- Production deployment should keep the backend private where possible and expose only the frontend and MockPass services publicly.

## Success Metrics

- Users can complete MockPass/Singpass login and reach the dashboard.
- Authenticated users can create, list, copy, QR-share, expire, and disable links.
- Public users can open active short links without authentication.
- Expired or disabled links stop redirecting immediately after cache invalidation or expiry.
- Railway deployment passes health checks for frontend, backend, PostgreSQL, Redis, and MockPass.
