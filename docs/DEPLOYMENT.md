# Railway Deployment

This app deploys to Railway as five services: `frontend`, `backend`, `mockpass`, `Postgres`, and `Redis`. Only `frontend` and `mockpass` need public domains. The backend should stay private and be called by the frontend over Railway private networking.

The backend listens on IPv6 host `::`, which is required for Railway private DNS. Keep the repository root as the build context and do not set a service root directory, because the Dockerfiles copy workspace-level files.

## Runtime Architecture

- Public browser traffic goes to the `frontend` service.
- Next.js API routes proxy authenticated API traffic to the private backend through `BACKEND_URL`.
- Public short-link routes are handled by the frontend and resolved through the backend redirect endpoint.
- The backend talks to PostgreSQL for persisted users and links.
- The backend talks to Redis for redirect cache entries and the short-code counter.
- MockPass reads the JWKS endpoint at `/.well-known/jwks.json` through the public frontend URL.

## 1. Create Services

```bash
railway init --name url-shortener
railway link --project url-shortener
railway add --service frontend
railway add --service backend
railway add --service mockpass
railway add --database postgres
railway add --database redis
```

If your database services are not named `Postgres` and `Redis`, update the variable references below.

## 2. Configure Builds

```bash
railway environment edit --service-config frontend build.builder DOCKERFILE
railway environment edit --service-config frontend build.dockerfilePath "apps/frontend/Dockerfile"
railway environment edit --service-config frontend deploy.ipv6EgressEnabled true

railway environment edit --service-config backend build.builder DOCKERFILE
railway environment edit --service-config backend build.dockerfilePath "apps/backend/Dockerfile"
railway environment edit --service-config backend deploy.healthcheckPath "/api/v1/health"
railway environment edit --service-config backend deploy.healthcheckTimeout 120

railway environment edit --service-config mockpass build.builder DOCKERFILE
railway environment edit --service-config mockpass build.dockerfilePath "docker/mockpass/Dockerfile"
railway environment edit --service-config mockpass deploy.ipv6EgressEnabled true
```

The backend container runs `pnpm run db:migrate:deploy` before `pnpm run start:prod`, so production migrations run during backend startup.

## 3. Add Public Domains

Generate public domains only for `frontend` and `mockpass`:

```bash
railway domain --service frontend --json
railway domain --service mockpass --json
```

Do not generate a public domain for `backend` unless you intentionally want to expose the API.

Set shell variables for the domains you generated:

```bash
export FRONTEND_URL='https://<frontend-domain>'
export MOCKPASS_URL='https://<mockpass-domain>'
```

## 4. Set Variables

Generate a JWT secret locally:

```bash
export JWT_SECRET="$(openssl rand -base64 32)"
```

Backend variables:

| Variable                | Value                                             |
| ----------------------- | ------------------------------------------------- |
| `DATABASE_URL`          | `${{Postgres.DATABASE_URL}}`                      |
| `REDIS_URL`             | `${{Redis.REDIS_URL}}`                            |
| `PORT`                  | `3001`                                            |
| `JWT_SECRET`            | Generated secret from `openssl rand -base64 32`.  |
| `FRONTEND_URL`          | Public frontend domain.                           |
| `SHORT_LINK_BASE_URL`   | Public frontend domain.                           |
| `MOCKPASS_ISSUER`       | Public MockPass domain plus `/singpass/v3/fapi`.  |
| `MOCKPASS_CLIENT_ID`    | `my-client-id` for the bundled MockPass setup.    |
| `MOCKPASS_REDIRECT_URI` | Public frontend domain plus `/api/auth/callback`. |

```bash
railway variable set DATABASE_URL='${{Postgres.DATABASE_URL}}' --service backend
railway variable set REDIS_URL='${{Redis.REDIS_URL}}' --service backend
railway variable set PORT=3001 --service backend
railway variable set JWT_SECRET="$JWT_SECRET" --service backend
railway variable set FRONTEND_URL="$FRONTEND_URL" --service backend
railway variable set SHORT_LINK_BASE_URL="$FRONTEND_URL" --service backend
railway variable set MOCKPASS_ISSUER="$MOCKPASS_URL/singpass/v3/fapi" --service backend
railway variable set MOCKPASS_CLIENT_ID='my-client-id' --service backend
railway variable set MOCKPASS_REDIRECT_URI="$FRONTEND_URL/api/auth/callback" --service backend
```

Frontend variables:

| Variable      | Value                                             |
| ------------- | ------------------------------------------------- |
| `BACKEND_URL` | `http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:3001` |

```bash
railway variable set BACKEND_URL='http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:3001' --service frontend
```

`NEXT_PUBLIC_API_URL` may appear in Docker-related configuration, but the current frontend code uses server-only `BACKEND_URL` for API proxy routes.

MockPass variables:

| Variable                    | Value                                                                   |
| --------------------------- | ----------------------------------------------------------------------- |
| `PORT`                      | `5156`                                                                  |
| `SHOW_LOGIN_PAGE`           | `true`                                                                  |
| `FAPI_CLIENT_JWKS_ENDPOINT` | `$FRONTEND_URL/.well-known/jwks.json`                                   |

```bash
railway variable set PORT=5156 --service mockpass
railway variable set SHOW_LOGIN_PAGE=true --service mockpass
railway variable set FAPI_CLIENT_JWKS_ENDPOINT="$FRONTEND_URL/.well-known/jwks.json" --service mockpass
```

## 5. Deploy

```bash
railway up --service mockpass --environment production --detach -m "Deploy MockPass"
railway up --service backend --environment production --detach -m "Deploy backend"
railway up --service frontend --environment production --detach -m "Deploy frontend"
```

If your environment is not named `production`, replace it in the commands.

## 6. Enable Automatic Deploys

```bash
railway environment edit --service-config frontend source.repo "jovnc/url-shortener"
railway environment edit --service-config frontend source.branch "main"
railway environment edit --service-config frontend build.watchPatterns '["apps/frontend/**","package.json","pnpm-lock.yaml","pnpm-workspace.yaml",".dockerignore"]'

railway environment edit --service-config backend source.repo "jovnc/url-shortener"
railway environment edit --service-config backend source.branch "main"
railway environment edit --service-config backend build.watchPatterns '["apps/backend/**","package.json","pnpm-lock.yaml","pnpm-workspace.yaml",".dockerignore"]'

railway environment edit --service-config mockpass source.repo "jovnc/url-shortener"
railway environment edit --service-config mockpass source.branch "main"
railway environment edit --service-config mockpass build.watchPatterns '["docker/mockpass/**",".dockerignore"]'
```

## 7. Verify

```bash
railway status --json
railway logs --service backend -n 100
railway logs --service frontend -n 100
curl -I "$FRONTEND_URL"
```

The backend health check runs at `/api/v1/health` on the private backend service and should show as healthy in Railway after deployment.

Browser verification:

- Open `$FRONTEND_URL`.
- Sign in through MockPass.
- Create a generated short link.
- Create a custom alias without hyphens.
- Open `$FRONTEND_URL/<short-code>` and confirm it redirects.
- Disable the link and confirm it stops redirecting with `410 Gone` behavior.
- Confirm browser network calls stay on the frontend domain rather than a public backend domain.

Production notes:

- `NODE_ENV=production` disables Swagger at `/api`.
- Redis contains the short-code counter, so preserve Redis state or reinitialize the counter carefully when restoring data.
- Keep backend private unless an external API consumer needs direct access.
