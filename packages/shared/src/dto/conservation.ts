import { z } from 'zod';
import {
  orgTypeSchema,
  participationRoleSchema,
  programCodeSchema,
  programRoleSchema,
  programStatusSchema,
  researchStatusSchema,
} from '../enums';
import { provenanceSchema, sourceSchema } from './common';
import { countryRefSchema, citySummarySchema } from './geography';
import { iucnBadgeSchema } from './zoo';

export const programSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  code: programCodeSchema,
  status: programStatusSchema,
  organization: z
    .object({ id: z.string().uuid(), slug: z.string(), name: z.string(), acronym: z.string().nullable() })
    .nullable(),
  startedYear: z.number().int().nullable(),
  endedYear: z.number().int().nullable(),
  speciesCount: z.number().int().nonnegative(),
  zooCount: z.number().int().nonnegative(),
});

export type ProgramSummaryDto = z.infer<typeof programSummarySchema>;

export const programSpeciesEntrySchema = z.object({
  taxon: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    scientificName: z.string(),
    commonNameRu: z.string().nullable(),
    iucn: iucnBadgeSchema.nullable(),
  }),
  role: programRoleSchema,
});

export const programZooEntrySchema = z.object({
  zoo: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    city: citySummarySchema,
  }),
  role: participationRoleSchema,
  sinceYear: z.number().int().nullable(),
  untilYear: z.number().int().nullable(),
});

export const programDetailSchema = programSummarySchema
  .omit({ speciesCount: true, zooCount: true })
  .extend({
    description: z.string().nullable(),
    species: z.array(programSpeciesEntrySchema),
    zoos: z.array(programZooEntrySchema),
    research: z.array(
      z.object({
        id: z.string().uuid(),
        slug: z.string(),
        title: z.string(),
        status: researchStatusSchema,
      }),
    ),
    sources: z.array(sourceSchema),
    provenance: z.array(provenanceSchema),
  });

export type ProgramDetailDto = z.infer<typeof programDetailSchema>;

export const organizationSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  acronym: z.string().nullable(),
  type: orgTypeSchema,
  country: countryRefSchema.nullable(),
  zooCount: z.number().int().nonnegative(),
  programCount: z.number().int().nonnegative(),
});

export type OrganizationSummaryDto = z.infer<typeof organizationSummarySchema>;

export const organizationDetailSchema = organizationSummarySchema
  .omit({ zooCount: true, programCount: true })
  .extend({
    foundedYear: z.number().int().nullable(),
    website: z.string().nullable(),
    description: z.string().nullable(),
    zoos: z.array(
      z.object({
        zoo: z.object({ id: z.string().uuid(), slug: z.string(), name: z.string() }),
        role: z.string().nullable(),
        sinceYear: z.number().int().nullable(),
      }),
    ),
    programs: z.array(
      z.object({
        id: z.string().uuid(),
        slug: z.string(),
        name: z.string(),
        code: programCodeSchema,
        status: programStatusSchema,
        startedYear: z.number().int().nullable(),
      }),
    ),
    research: z.array(
      z.object({
        id: z.string().uuid(),
        slug: z.string(),
        title: z.string(),
        status: researchStatusSchema,
      }),
    ),
    sources: z.array(sourceSchema),
  });

export type OrganizationDetailDto = z.infer<typeof organizationDetailSchema>;

export const researchSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  status: researchStatusSchema,
  startedYear: z.number().int().nullable(),
  endedYear: z.number().int().nullable(),
  leadOrganization: z
    .object({ id: z.string().uuid(), slug: z.string(), name: z.string() })
    .nullable(),
  zooCount: z.number().int().nonnegative(),
  speciesCount: z.number().int().nonnegative(),
});

export type ResearchSummaryDto = z.infer<typeof researchSummarySchema>;

export const researchDetailSchema = researchSummarySchema
  .omit({ zooCount: true, speciesCount: true })
  .extend({
    summary: z.string().nullable(),
    zoos: z.array(
      z.object({ id: z.string().uuid(), slug: z.string(), name: z.string() }),
    ),
    species: z.array(
      z.object({
        id: z.string().uuid(),
        slug: z.string(),
        scientificName: z.string(),
        commonNameRu: z.string().nullable(),
      }),
    ),
    sources: z.array(sourceSchema),
    provenance: z.array(provenanceSchema),
  });

export type ResearchDetailDto = z.infer<typeof researchDetailSchema>;
