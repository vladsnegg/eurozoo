import { z } from 'zod';
import { countryRefSchema } from './geography';

export const newsZooRefSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  locationLabel: z.string().nullable(),
  city: z.object({
    name: z.string(),
    slug: z.string(),
    country: countryRefSchema,
  }),
});

export const newsSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  summary: z.string().nullable(),
  url: z.string(),
  sourceName: z.string().nullable(),
  publishedAt: z.string(),
  zoo: newsZooRefSchema,
});

export type NewsSummaryDto = z.infer<typeof newsSummarySchema>;
