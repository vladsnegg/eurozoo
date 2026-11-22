import { z } from 'zod';
import { entityTypeSchema } from '../enums';

export const statsSchema = z.object({
  zoos: z.number().int().nonnegative(),
  species: z.number().int().nonnegative(),
  countries: z.number().int().nonnegative(),
  programs: z.number().int().nonnegative(),
  organizations: z.number().int().nonnegative(),
  research: z.number().int().nonnegative(),
  sources: z.number().int().nonnegative(),
  edges: z.number().int().nonnegative(),
});

export type StatsDto = z.infer<typeof statsSchema>;

export const recentEntitySchema = z.object({
  type: entityTypeSchema,
  id: z.string().uuid(),
  title: z.string(),
  subtitle: z.string().nullable(),
  url: z.string(),
  updatedAt: z.string(),
});

export const highlightsSchema = z.object({
  topSpecies: z.array(
    z.object({
      id: z.string().uuid(),
      slug: z.string(),
      title: z.string(),
      zooCount: z.number().int().nonnegative(),
    }),
  ),
  topCountries: z.array(
    z.object({
      id: z.string().uuid(),
      slug: z.string(),
      title: z.string(),
      zooCount: z.number().int().nonnegative(),
    }),
  ),
  topPrograms: z.array(
    z.object({
      id: z.string().uuid(),
      slug: z.string(),
      title: z.string(),
      zooCount: z.number().int().nonnegative(),
    }),
  ),
  recent: z.array(recentEntitySchema),
});

export type HighlightsDto = z.infer<typeof highlightsSchema>;

export const searchResultSchema = z.object({
  type: entityTypeSchema,
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  url: z.string(),
  score: z.number(),
  highlight: z.string().nullable(),
});

export type SearchResultDto = z.infer<typeof searchResultSchema>;

export const searchResponseSchema = z.object({
  query: z.string(),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  groups: z.array(
    z.object({
      type: entityTypeSchema,
      label: z.string(),
      total: z.number().int().nonnegative(),
      items: z.array(searchResultSchema),
    }),
  ),
  facets: z.object({
    types: z.array(z.object({ value: z.string(), count: z.number().int() })),
    countries: z.array(z.object({ value: z.string(), label: z.string(), count: z.number().int() })),
    iucn: z.array(z.object({ value: z.string(), label: z.string(), count: z.number().int() })),
    programs: z.array(z.object({ value: z.string(), label: z.string(), count: z.number().int() })),
  }),
  suggestions: z.array(z.object({ title: z.string(), url: z.string(), score: z.number() })),
});

export type SearchResponseDto = z.infer<typeof searchResponseSchema>;

export const graphNodeSchema = z.object({
  type: entityTypeSchema,
  id: z.string().uuid(),
  label: z.string(),
  subtitle: z.string().nullable(),
  url: z.string(),
  degree: z.number().int().nonnegative(),
  inferred: z.boolean().optional(),
});

export const graphEdgeSchema = z.object({
  src: z.string().uuid(),
  dst: z.string().uuid(),
  predicate: z.string(),
  labelRu: z.string(),
  confidence: z.number().nullable(),
  inferred: z.boolean(),
});

export const graphResponseSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
  truncated: z.boolean(),
  stats: z.object({
    nodes: z.number().int().nonnegative(),
    edges: z.number().int().nonnegative(),
    depth: z.number().int().min(0),
  }),
});

export type GraphResponseDto = z.infer<typeof graphResponseSchema>;

export const relatedItemSchema = z.object({
  type: entityTypeSchema,
  id: z.string().uuid(),
  label: z.string(),
  subtitle: z.string().nullable(),
  url: z.string(),
});

export const relatedGroupSchema = z.object({
  predicate: z.string(),
  labelRu: z.string(),
  items: z.array(relatedItemSchema),
});

export type RelatedGroupDto = z.infer<typeof relatedGroupSchema>;

export const similarEntitySchema = z.object({
  type: entityTypeSchema,
  id: z.string().uuid(),
  label: z.string(),
  url: z.string(),
  score: z.number(),
  reason: z.string(),
});

export type SimilarEntityDto = z.infer<typeof similarEntitySchema>;

export const healthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  database: z.enum(['up', 'down']),
  version: z.string(),
  uptimeSeconds: z.number(),
});

export type HealthDto = z.infer<typeof healthSchema>;
