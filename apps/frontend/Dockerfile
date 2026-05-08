FROM node:24-alpine AS base
RUN corepack enable

# Install and build only
# Requires the entire monorepo for pnpm workspace to resolve dependencies correctly
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm fe run build

# Copy compiled frontend and runtime dependencies only
# Run the Next.js server in production mode
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm fe install --frozen-lockfile...
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY apps/frontend/next.config.ts ./apps/frontend/next.config.ts
EXPOSE 3000
CMD ["pnpm", "--filter", "frontend", "run", "start"]
