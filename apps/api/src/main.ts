import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpErrorFilter } from './http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({ origin: webOrigin, credentials: true });
  app.use(cookieParser());
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
      ((request.headers.origin && request.headers.origin !== webOrigin) ||
        (request.headers.cookie && !request.headers.origin))
    ) {
      response.status(403).json({
        statusCode: 403,
        message: 'Invalid origin',
        path: request.path,
      });
      return;
    }
    next();
  });
  app.useGlobalFilters(new HttpErrorFilter());
  await app.listen(Number(process.env.PORT ?? 3001));
}

void bootstrap();
