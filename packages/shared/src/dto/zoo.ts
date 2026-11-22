import { z } from 'zod';
import {
  enclosureTypeSchema,
  eventTypeSchema,
  facilityCategorySchema,
  audienceSchema,
  educationFormatSchema,
  participationRoleSchema,
  programCodeSchema,
  programStatusSchema,
  researchStatusSchema,
  zooStatusSchema,
} from '../enums';
import { provenanceSchema, sourceSchema } from './common';
import { countryRefSchema, citySummarySchema } from './geography';

export const zooSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  nameLocal: z.string().nullable(),
  city: z.object({
    name: z.string(),
    slug: z.string(),
    country: countryRefSchema,
  }),
  locationLabel: z.string().nullable(),
  foundedYear: z.number().int().nullable(),
  areaHa: z.number().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  status: zooStatusSchema,
  speciesCount: z.number().int().nonnegative(),
  hasPrograms: z.boolean(),
  hasThreatened: z.boolean(),
  updatedAt: z.string(),
});

export type ZooSummaryDto = z.infer<typeof zooSummarySchema>;

export const iucnBadgeSchema = z.object({
  code: z.string(),
  nameRu: z.string(),
  severity: z.number().int(),
  color: z.string(),
});

export type IucnBadgeDto = z.infer<typeof iucnBadgeSchema>;

export const zooSpeciesEntrySchema = z.object({
  taxon: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    scientificName: z.string(),
    commonNameRu: z.string().nullable(),
    iucn: iucnBadgeSchema.nullable(),
  }),
  countMale: z.number().int().nullable(),
  countFemale: z.number().int().nullable(),
  countUnsexed: z.number().int().nullable(),
  totalCount: z.number().int().nullable(),
  breeding: z.boolean(),
  sinceYear: z.number().int().nullable(),
});

export type ZooSpeciesEntryDto = z.infer<typeof zooSpeciesEntrySchema>;

export const zooProgramEntrySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  code: programCodeSchema,
  status: programStatusSchema,
  role: participationRoleSchema,
  sinceYear: z.number().int().nullable(),
  untilYear: z.number().int().nullable(),
});

export const zooOrganizationEntrySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  acronym: z.string().nullable(),
  role: z.string().nullable(),
  sinceYear: z.number().int().nullable(),
});

export const zooResearchEntrySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  status: researchStatusSchema,
  startedYear: z.number().int().nullable(),
  endedYear: z.number().int().nullable(),
});

export const zooEducationEntrySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  audience: audienceSchema,
  format: educationFormatSchema,
  url: z.string().nullable(),
});

export const zooFacilityEntrySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  category: facilityCategorySchema,
  note: z.string().nullable(),
});

export const zooEventEntrySchema = z.object({
  id: z.string().uuid(),
  year: z.number().int(),
  exactDate: z.string().nullable(),
  type: eventTypeSchema,
  title: z.string(),
  description: z.string().nullable(),
});

export const zooEnclosureEntrySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: enclosureTypeSchema.nullable(),
  areaM2: z.number().nullable(),
});

export const zooDetailSchema = zooSummarySchema
  .omit({ speciesCount: true, hasPrograms: true, hasThreatened: true })
  .extend({
    description: z.string().nullable(),
    website: z.string().nullable(),
    annualVisitors: z.number().int().nullable(),
    city: citySummarySchema,
    species: z.array(zooSpeciesEntrySchema),
    programs: z.array(zooProgramEntrySchema),
    organizations: z.array(zooOrganizationEntrySchema),
    research: z.array(zooResearchEntrySchema),
    education: z.array(zooEducationEntrySchema),
    facilities: z.array(zooFacilityEntrySchema),
    events: z.array(zooEventEntrySchema),
    enclosures: z.array(zooEnclosureEntrySchema),
    sources: z.array(sourceSchema),
    provenance: z.array(provenanceSchema),
  });

export type ZooDetailDto = z.infer<typeof zooDetailSchema>;
