# Railway Deployment

This app deploys to Railway as five services: `frontend`, `backend`, `mockpass`, `Postgres`, and `Redis`. Only `frontend` and `mockpass` get public domains; `backend` is private and is called by `frontend` over Railway private networking.

Keep the repository root as the build context. Do not set a service root directory, because the Dockerfiles use workspace-level files.

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

railway environment edit --service-config backend build.builder DOCKERFILE
railway environment edit --service-config backend build.dockerfilePath "apps/backend/Dockerfile"
railway environment edit --service-config backend deploy.healthcheckPath "/api/v1/health"
railway environment edit --service-config backend deploy.healthcheckTimeout 120

railway environment edit --service-config mockpass build.builder DOCKERFILE
railway environment edit --service-config mockpass build.dockerfilePath "docker/mockpass/Dockerfile"
```

## 3. Add Public Domains

Generate public domains only for `frontend` and `mockpass`:

```bash
railway domain --service frontend --json
railway domain --service mockpass --json
```

Do not generate a domain for `backend`.

For the current production frontend, use:

```bash
export FRONTEND_URL='https://frontend-production-80ed.up.railway.app'
export MOCKPASS_URL='https://<mockpass-domain>'
```

## 4. Set Variables

Generate a JWT secret locally:

```bash
export JWT_SECRET="$(openssl rand -base64 32)"
```

Set backend variables:

```bash
railway variable set DATABASE_URL='${{Postgres.DATABASE_URL}}' --service backend
railway variable set REDIS_URL='${{Redis.REDIS_URL}}' --service backend
railway variable set JWT_SECRET="$JWT_SECRET" --service backend
railway variable set FRONTEND_URL="$FRONTEND_URL" --service backend
railway variable set SHORT_LINK_BASE_URL="$FRONTEND_URL" --service backend
railway variable set MOCKPASS_ISSUER="$MOCKPASS_URL/singpass/v3/fapi" --service backend
railway variable set MOCKPASS_CLIENT_ID='my-client-id' --service backend
railway variable set MOCKPASS_REDIRECT_URI="$FRONTEND_URL/api/auth/callback" --service backend
```

Set frontend variables:

```bash
railway variable set BACKEND_URL='http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:3001' --service frontend
```

Set Mockpass variables:

```bash
railway variable set PORT=5156 --service mockpass
railway variable set SHOW_LOGIN_PAGE=true --service mockpass
railway variable set FAPI_CLIENT_JWKS_ENDPOINT='http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:3001/.well-known/jwks.json' --service mockpass
```

## 5. Deploy

```bash
railway up --service mockpass --environment production --detach -m "Deploy Mockpass"
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

Then verify in the browser that login, link creation, link listing, disabling links, and opening `https://frontend-production-80ed.up.railway.app/<short-code>` work. The browser network tab should only show calls to the frontend domain.
