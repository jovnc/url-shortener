FROM node:22-alpine AS base
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter backend run db:generate && pnpm --filter backend run build

FROM base AS runner
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
RUN pnpm install --frozen-lockfile --filter backend...
ENV NODE_ENV=production
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
EXPOSE 3001
CMD ["sh", "-c", "cd /app/apps/backend && /app/node_modules/.bin/prisma migrate deploy && node dist/src/main.js"]
