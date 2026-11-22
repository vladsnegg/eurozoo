import { z } from 'zod';
import { programCodeSchema, programStatusSchema, programRoleSchema, trendSchema } from '../enums';
import { provenanceSchema, sourceSchema } from './common';
import { citySummarySchema } from './geography';
import { iucnBadgeSchema } from './zoo';

export const rankRefSchema = z.object({
  code: z.string(),
  nameRu: z.string(),
  level: z.number().int(),
});

export type RankRefDto = z.infer<typeof rankRefSchema>;

export const taxonNodeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  scientificName: z.string(),
  commonNameRu: z.string().nullable(),
  commonNameEn: z.string().nullable(),
  rank: rankRefSchema,
  childrenCount: z.number().int().nonnegative(),
});

export type TaxonNodeDto = z.infer<typeof taxonNodeSchema>;

export const taxonLineageSchema = z.object({
  items: z.array(taxonNodeSchema),
});

export type TaxonLineageDto = z.infer<typeof taxonLineageSchema>;

export const habitatRefSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  biome: z.string(),
});

export const speciesSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  scientificName: z.string(),
  commonNameRu: z.string().nullable(),
  commonNameEn: z.string().nullable(),
  rank: rankRefSchema,
  iucn: iucnBadgeSchema.nullable(),
  zooCount: z.number().int().nonnegative(),
  programCount: z.number().int().nonnegative(),
  imageUrl: z.string().nullable(),
  imageCredit: z.string().nullable(),
  imageCreditUrl: z.string().nullable(),
});

export type SpeciesSummaryDto = z.infer<typeof speciesSummarySchema>;

export const speciesProfileSchema = z.object({
  populationTrend: trendSchema.nullable(),
  habitatSummary: z.string().nullable(),
  dietSummary: z.string().nullable(),
  lifespanYears: z.number().nullable(),
  weightKgMin: z.number().nullable(),
  weightKgMax: z.number().nullable(),
  lengthCmMin: z.number().nullable(),
  lengthCmMax: z.number().nullable(),
});

export const speciesZooEntrySchema = z.object({
  zoo: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    city: citySummarySchema,
  }),
  countMale: z.number().int().nullable(),
  countFemale: z.number().int().nullable(),
  countUnsexed: z.number().int().nullable(),
  breeding: z.boolean(),
  sinceYear: z.number().int().nullable(),
});

export const speciesProgramEntrySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  code: programCodeSchema,
  status: programStatusSchema,
  role: programRoleSchema,
  zooCount: z.number().int().nonnegative(),
});

export const speciesDetailSchema = speciesSummarySchema
  .omit({ zooCount: true, programCount: true })
  .extend({
    description: z.string().nullable(),
    authority: z.string().nullable(),
    yearDescribed: z.number().int().nullable(),
    profile: speciesProfileSchema.nullable(),
    habitats: z.array(habitatRefSchema),
    lineage: z.array(taxonNodeSchema),
    zoos: z.array(speciesZooEntrySchema),
    programs: z.array(speciesProgramEntrySchema),
    research: z.array(
      z.object({
        id: z.string().uuid(),
        slug: z.string(),
        title: z.string(),
        status: z.string(),
        startedYear: z.number().int().nullable(),
        endedYear: z.number().int().nullable(),
      }),
    ),
    inferredProgramSpecies: z.array(
      z.object({
        zoo: z.object({ id: z.string().uuid(), slug: z.string(), name: z.string() }),
        program: z.object({ id: z.string().uuid(), slug: z.string(), name: z.string() }),
        inferred: z.literal(true),
      }),
    ),
    sources: z.array(sourceSchema),
    provenance: z.array(provenanceSchema),
  });

export type SpeciesDetailDto = z.infer<typeof speciesDetailSchema>;
