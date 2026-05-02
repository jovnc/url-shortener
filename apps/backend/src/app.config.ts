import { registerAs } from '@nestjs/config';

const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'DATABASE_URL',
  'REDIS_URL',
  'MOCKPASS_ISSUER',
  'MOCKPASS_CLIENT_ID',
  'MOCKPASS_REDIRECT_URI',
] as const;

export const appConfig = registerAs('app', () => {
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
  }

  return {
    port: parseInt(process.env.PORT ?? '3001', 10),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    shortLinkBaseUrl:
      process.env.SHORT_LINK_BASE_URL ?? 'http://localhost:3001',
    jwtSecret: process.env.JWT_SECRET!,
    databaseUrl: process.env.DATABASE_URL!,
    redisUrl: process.env.REDIS_URL!,
    mockpass: {
      issuer: process.env.MOCKPASS_ISSUER!,
      clientId: process.env.MOCKPASS_CLIENT_ID!,
      redirectUri: process.env.MOCKPASS_REDIRECT_URI!,
    },
  };
});

export type AppConfig = ReturnType<typeof appConfig>;
