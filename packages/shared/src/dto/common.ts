import { z } from 'zod';
import {
  reliabilitySchema,
  sourceTypeSchema,
  provenanceStatusSchema,
} from '../enums';

export const errorSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  requestId: z.string().optional(),
  errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

export type ErrorDto = z.infer<typeof errorSchema>;

export const sourceSchema = z.object({
  id: z.string().uuid(),
  type: sourceTypeSchema,
  title: z.string(),
  url: z.string().url(),
  publisher: z.string().nullable(),
  publishedAt: z.string().nullable(),
  accessedAt: z.string(),
  license: z.string().nullable(),
  reliability: reliabilitySchema,
});

export type SourceDto = z.infer<typeof sourceSchema>;

export const provenanceSchema = z.object({
  sourceId: z.string().uuid(),
  title: z.string(),
  url: z.string().url(),
  publisher: z.string().nullable(),
  type: sourceTypeSchema,
  reliability: reliabilitySchema,
  confidence: z.number().min(0).max(1).nullable(),
  retrievedAt: z.string().nullable(),
  verifiedAt: z.string().nullable(),
  status: provenanceStatusSchema,
});

export type ProvenanceDto = z.infer<typeof provenanceSchema>;

export const linkRefSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
});

export type LinkRefDto = z.infer<typeof linkRefSchema>;
