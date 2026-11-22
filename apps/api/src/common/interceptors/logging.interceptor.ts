import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.write(request, response, startedAt),
        error: () => this.write(request, response, startedAt),
      }),
    );
  }

  private write(request: Request, response: Response, startedAt: number): void {
    const line = JSON.stringify({
      level: 'info',
      method: request.method,
      url: request.originalUrl,
      status: response.statusCode,
      durationMs: Date.now() - startedAt,
      requestId: request.requestId,
    });
    process.stdout.write(`${line}\n`);
  }
}
