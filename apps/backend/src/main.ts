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

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Server Monitor API')
    .setDescription('The server monitor API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // Bootstrap configuration
  app.setGlobalPrefix('api/v1', {
    exclude: ['.well-known/*path'],
  });

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(port);
}

void bootstrap();
