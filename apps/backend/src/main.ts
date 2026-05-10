import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import express from 'express';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { CsrfService } from './common/csrf/csrf.service.js';
import type { AppConfig } from './app.config.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const configService = app.get(ConfigService);
  const { port, frontendUrl } = configService.getOrThrow<AppConfig>('app');

  // All routes will be prefixed with /api/v1
  // except for .well-known/* endpoints which is used for OIDC discovery
  app.setGlobalPrefix('api/v1', {
    exclude: ['.well-known/*path'],
  });

  // NestJS Swagger setup, only in non-production environments
  // Available at http://localhost:3001/api in development
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('URL Shortener API')
      .setDescription('API documentation for URL shortening and authentication')
      .setVersion('1.0')
      .build();
    SwaggerModule.setup('api', app, () =>
      SwaggerModule.createDocument(app, config),
    );
  }

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-CSRF-TOKEN'],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'Retry-After',
    ],
    maxAge: 600,
  });

  // Trust first proxy since deployed on Railway, for local development can use 'loopback' as well
  // Refer to https://docs.nestjs.com/security/rate-limiting#proxies
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginEmbedderPolicy: false }));
  app.use(express.json({ limit: '16kb' }));
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));

  // Required for cookie parsing since we use cookies for OIDC session management
  app.use(cookieParser());

  const csrfService = app.get(CsrfService);
  app.use(csrfService.middleware);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(port, '::');
}

void bootstrap();
