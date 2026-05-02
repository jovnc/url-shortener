# Railway Deployment

This app deploys to Railway as five services:

- `frontend`: Next.js app from `apps/frontend/Dockerfile`
- `backend`: NestJS API from `apps/backend/Dockerfile`
- `mockpass`: test Singpass provider from `docker/mockpass/Dockerfile`
- `Postgres`: Railway managed Postgres
- `Redis`: Railway managed Redis

Keep the repository root as the build context. Do not set a service root directory, because the Dockerfiles use the root workspace files.

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

## 3. Add Domains

Generate Railway domains for the app services:

```bash
railway domain --service frontend --json
railway domain --service backend --json
railway domain --service mockpass --json
```

Use the resulting public URLs in the variables below.

## 4. Set Variables

Generate a JWT secret locally:

```bash
openssl rand -base64 32
```

Set backend variables:

```bash
railway variable set DATABASE_URL='${{Postgres.DATABASE_URL}}' --service backend
railway variable set REDIS_URL='${{Redis.REDIS_URL}}' --service backend
railway variable set JWT_SECRET='<generated-secret>' --service backend
railway variable set FRONTEND_URL='https://<frontend-domain>' --service backend
railway variable set SHORT_LINK_BASE_URL='https://<backend-domain>' --service backend
railway variable set MOCKPASS_ISSUER='https://<mockpass-domain>/singpass/v3/fapi' --service backend
railway variable set MOCKPASS_CLIENT_ID='my-client-id' --service backend
railway variable set MOCKPASS_REDIRECT_URI='https://<backend-domain>/api/v1/auth/callback' --service backend
```

Set frontend variables:

```bash
railway variable set NEXT_PUBLIC_API_URL='https://<backend-domain>' --service frontend
```

`NEXT_PUBLIC_API_URL` is baked into the frontend at build time, so redeploy `frontend` after changing it.

Set Mockpass variables:

```bash
railway variable set PORT=5156 --service mockpass
railway variable set SHOW_LOGIN_PAGE=true --service mockpass
railway variable set FAPI_CLIENT_JWKS_ENDPOINT='https://<backend-domain>/.well-known/jwks.json' --service mockpass
```

## 5. Deploy

Deploy Mockpass first, then backend, then frontend:

```bash
railway up --service mockpass --environment production --detach -m "Deploy Mockpass"
railway up --service backend --environment production --detach -m "Deploy backend"
railway up --service frontend --environment production --detach -m "Deploy frontend"
```

If your environment is not named `production`, replace it in the commands.

## 6. Enable Automatic Deploys

Connect each app service to the GitHub repository and deploy from `main`:

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

Keep the repository root as the build context. Do not set `source.rootDirectory`, because the Dockerfiles copy workspace-level files.

The watch patterns prevent unrelated changes from redeploying every service. After this is configured, pushes to `main` trigger automatic Railway deployments for the affected services.

## 7. Verify

```bash
railway status --json
curl https://<backend-domain>/api/v1/health
curl -I https://<backend-domain>/api/v1/auth/login
```

Expected health response:

```json
{ "status": "ok" }
```

For cross-origin frontend/backend deployments, auth cookies must include `Secure; SameSite=None`. Confirm this in the `/api/v1/auth/login` response headers.
