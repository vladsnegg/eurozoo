import { z } from 'zod';

export const MAX_PAGE_SIZE = 1000;
export const DEFAULT_PAGE_SIZE = 24;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  sort: z.string().min(1).max(64).optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
  });

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export function pageToSkip(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
