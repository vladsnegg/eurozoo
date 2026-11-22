import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import type { Paginated } from '@eurozoo/shared';

export const booleanQuery = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export function parseQuery<T extends z.ZodTypeAny>(schema: T, query: unknown): z.infer<T> {
  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    throw new BadRequestException(
      parsed.error.issues.map((issue) => `${issue.path.join('.') || 'query'}: ${issue.message}`),
    );
  }
  return parsed.data;
}

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  return { items, total, page, pageSize };
}

export function toISO(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

export function toDateISO(date: Date | null | undefined): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}
