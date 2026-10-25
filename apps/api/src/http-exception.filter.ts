import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '@paymesh/shared';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(error: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = error instanceof HttpException ? error.getStatus() : 500;
    const message =
      error instanceof HttpException ? error.message : 'Internal server error';
    if (statusCode === 500) this.logger.error(error);
    const body: ApiErrorResponse = { statusCode, message, path: request.path };
    response.status(statusCode).json(body);
  }
}
