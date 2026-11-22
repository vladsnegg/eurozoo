import { z } from 'zod';

export const countryRefSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  iso2: z.string(),
});

export type CountryRefDto = z.infer<typeof countryRefSchema>;

export const countrySummarySchema = z.object({
  id: z.string().uuid(),
  iso2: z.string(),
  iso3: z.string(),
  name: z.string(),
  nameLocal: z.string().nullable(),
  slug: z.string(),
  euMember: z.boolean(),
  zooCount: z.number().int().nonnegative(),
  speciesCount: z.number().int().nonnegative(),
});

export type CountrySummaryDto = z.infer<typeof countrySummarySchema>;

export const citySummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  population: z.number().int().nullable(),
  country: countryRefSchema,
});

export type CitySummaryDto = z.infer<typeof citySummarySchema>;

export const zooRefSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
});

export type ZooRefDto = z.infer<typeof zooRefSchema>;

export const countryDetailSchema = countrySummarySchema.extend({
  regions: z.array(z.object({ id: z.string().uuid(), name: z.string(), slug: z.string() })),
  cities: z.array(citySummarySchema),
  zoos: z.array(zooRefSchema),
  organizations: z.array(z.object({ id: z.string().uuid(), slug: z.string(), name: z.string() })),
});

export type CountryDetailDto = z.infer<typeof countryDetailSchema>;

export const cityDetailSchema = citySummarySchema.extend({
  region: z.object({ id: z.string().uuid(), name: z.string(), slug: z.string() }).nullable(),
  zoos: z.array(zooRefSchema),
});

export type CityDetailDto = z.infer<typeof cityDetailSchema>;
