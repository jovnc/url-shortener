import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET!,
  databaseUrl: process.env.DATABASE_URL!,
  mockpass: {
    issuer: process.env.MOCKPASS_ISSUER!,
    clientId: process.env.MOCKPASS_CLIENT_ID!,
    redirectUri: process.env.MOCKPASS_REDIRECT_URI!,
  },
}));

export type AppConfig = ReturnType<typeof appConfig>;
