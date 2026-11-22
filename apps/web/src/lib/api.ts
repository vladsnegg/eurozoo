import { notFound } from 'next/navigation';
import { ApiError, apiGet } from './api-client';

export type Query = Record<string, string | number | boolean | undefined | null>;

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function pageOf(value: string | string[] | undefined): number {
  const raw = Number(first(value) ?? 1);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
}

export function buildQuery(params: Query): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function getList<T>(path: string, params: Query = {}): Promise<Page<T>> {
  return apiGet<Page<T>>(path + buildQuery(params));
}

export async function getOne<T>(path: string): Promise<T> {
  try {
    return await apiGet<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function safeList<T>(path: string, params: Query = {}): Promise<T[]> {
  try {
    const data = await getList<T>(path, params);
    return data.items;
  } catch {
    return [];
  }
}

export async function safeArray<T>(path: string, params: Query = {}): Promise<T[]> {
  try {
    return await apiGet<T[]>(path + buildQuery(params));
  } catch {
    return [];
  }
}
