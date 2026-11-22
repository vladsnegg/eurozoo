import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import type { ErrorDto } from '@eurozoo/shared';
import { env } from '../../config/env';

const TITLES: Partial<Record<number, string>> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

const TYPES: Partial<Record<number, string>> = {
  400: 'validation_error',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'validation_error',
  429: 'rate_limited',
  500: 'internal_error',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const prismaCode =
      exception instanceof Prisma.PrismaClientKnownRequestError ? exception.code : null;

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (prismaCode === 'P2002') status = HttpStatus.CONFLICT;
    if (prismaCode === 'P2003' || prismaCode === 'P2014') status = HttpStatus.CONFLICT;
    if (prismaCode === 'P2025') status = HttpStatus.NOT_FOUND;

    const body: ErrorDto = {
      type: TYPES[status] ?? 'internal_error',
      title: TITLES[status] ?? 'Error',
      status,
      instance: request.originalUrl,
      requestId: request.requestId,
    };

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        body.detail = payload;
      } else if (payload && typeof payload === 'object') {
        const record = payload as { message?: unknown };
        if (Array.isArray(record.message)) {
          body.errors = record.message.map((message) => ({ path: '', message: String(message) }));
        } else if (typeof record.message === 'string') {
          body.detail = record.message;
        }
      }
    } else if (prismaCode) {
      body.detail =
        prismaCode === 'P2002'
          ? 'Нарушено ограничение уникальности'
          : prismaCode === 'P2025'
            ? 'Запись не найдена'
            : 'Операция нарушает целостность данных';
    } else {
      if (env.NODE_ENV !== 'production') {
        body.detail = exception instanceof Error ? exception.message : 'Unknown error';
      }
      process.stderr.write(
        `[error] ${request.method} ${request.originalUrl} ${status}: ${
          exception instanceof Error ? exception.stack ?? exception.message : String(exception)
        }\n`,
      );
    }

    response.status(status).json(body);
  }
}
