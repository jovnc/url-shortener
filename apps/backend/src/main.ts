import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { AppConfig } from './app.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const { port, frontendUrl } = configService.getOrThrow<AppConfig>('app');

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
  });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(port, '::');
}

void bootstrap();
