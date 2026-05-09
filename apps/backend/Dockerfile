FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Install and build only
# Requires the entire monorepo for pnpm workspace to resolve dependencies correctly
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm be run db:generate && pnpm be run build
RUN pnpm deploy --filter backend --prod --legacy /deploy

# Copy compiled backend and runtime dependencies only
# Run migrations on startup, then start the server
FROM base AS runner
WORKDIR /app
COPY --from=builder /deploy ./
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma/generated ./prisma/generated
ENV NODE_ENV=production
EXPOSE 3001
CMD ["sh", "-c", "pnpm run db:migrate:deploy && pnpm run start:prod"]
