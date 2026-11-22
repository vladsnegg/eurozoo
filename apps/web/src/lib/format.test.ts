import { describe, expect, it } from 'vitest';
import { buildQuery, pageOf } from './api';
import { formatDate, formatNumber, formatRange } from './format';

describe('format helpers', () => {
  it('formats unknown numbers explicitly', () => {
    expect(formatNumber(null)).toBe('нет данных');
    expect(formatNumber(1500)).toContain('1');
  });

  it('formats ranges without inventing values', () => {
    expect(formatRange(null, null, 'кг')).toBe('нет данных');
    expect(formatRange(null, 120, 'кг')).toBe('120 кг');
    expect(formatRange(90, 300, 'кг')).toContain('–');
  });

  it('formats dates in Russian locale and handles invalid input', () => {
    expect(formatDate('2026-11-17')).toBe('17.11.2026');
    expect(formatDate(null)).toBe('нет данных');
    expect(formatDate('not-a-date')).toBe('нет данных');
  });
});

describe('query helpers', () => {
  it('builds query string skipping empty values', () => {
    expect(buildQuery({ country: 'czechia', page: 2, sort: undefined })).toBe('?country=czechia&page=2');
    expect(buildQuery({})).toBe('');
  });

  it('normalizes page numbers', () => {
    expect(pageOf(undefined)).toBe(1);
    expect(pageOf('3')).toBe(3);
    expect(pageOf('-2')).toBe(1);
    expect(pageOf('abc')).toBe(1);
  });
});
