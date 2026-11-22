import type { EntityType } from '@prisma/client';
import { z } from 'zod';

export type ResourceConfig = {
  delegate: string;
  label: string;
  entityType?: EntityType;
  publishable: boolean;
  searchFields: string[];
  orderBy: Record<string, 'asc' | 'desc'>;
  create: z.ZodObject<z.ZodRawShape>;
  relations?: string[];
};

const optionalText = z.string().max(5000).nullish();
const optionalYear = z.coerce.number().int().min(1200).max(2100).nullish();
const optionalNumber = z.coerce.number().nullish();
const optionalId = z.string().uuid().nullish();

export const RESOURCES: Record<string, ResourceConfig> = {
  zoos: {
    delegate: 'zoo',
    label: 'Зоопарки',
    entityType: 'zoo',
    publishable: true,
    searchFields: ['name', 'nameLocal', 'slug'],
    orderBy: { name: 'asc' },
    relations: ['species', 'programs', 'organizations'],
    create: z.object({
      slug: z.string().min(1).max(120),
      name: z.string().min(1).max(200),
      nameLocal: optionalText,
      cityId: z.string().uuid(),
      foundedYear: optionalYear,
      areaHa: optionalNumber,
      annualVisitors: z.coerce.number().int().nonnegative().nullish(),
      website: z.string().url().nullish(),
      lat: z.coerce.number().min(34).max(75).nullish(),
      lng: z.coerce.number().min(-25).max(60).nullish(),
      description: optionalText,
      status: z.enum(['active', 'closed', 'planned']).default('active'),
      publishStatus: z.enum(['draft', 'review', 'published']).default('draft'),
    }),
  },
  taxa: {
    delegate: 'taxon',
    label: 'Таксоны и виды',
    entityType: 'species',
    publishable: true,
    searchFields: ['scientificName', 'commonNameRu', 'commonNameEn', 'slug'],
    orderBy: { scientificName: 'asc' },
    create: z.object({
      slug: z.string().min(1).max(120),
      rankId: z.coerce.number().int().min(1).max(20),
      parentId: optionalId,
      scientificName: z.string().min(2).max(200),
      commonNameRu: optionalText,
      commonNameEn: optionalText,
      authority: optionalText,
      yearDescribed: optionalYear,
      gbifKey: z.coerce.number().int().nullish(),
      description: optionalText,
      publishStatus: z.enum(['draft', 'review', 'published']).default('published'),
    }),
  },
  countries: {
    delegate: 'country',
    label: 'Страны',
    entityType: 'country',
    publishable: false,
    searchFields: ['name', 'nameLocal', 'iso2', 'iso3', 'slug'],
    orderBy: { name: 'asc' },
    create: z.object({
      iso2: z.string().length(2),
      iso3: z.string().length(3),
      name: z.string().min(1).max(120),
      nameLocal: optionalText,
      slug: z.string().min(1).max(120),
      euMember: z.coerce.boolean().default(false),
    }),
  },
  regions: {
    delegate: 'region',
    label: 'Регионы',
    entityType: 'region',
    publishable: false,
    searchFields: ['name', 'slug'],
    orderBy: { name: 'asc' },
    create: z.object({
      countryId: z.string().uuid(),
      name: z.string().min(1).max(160),
      slug: z.string().min(1).max(120),
    }),
  },
  cities: {
    delegate: 'city',
    label: 'Города',
    entityType: 'city',
    publishable: false,
    searchFields: ['name', 'slug'],
    orderBy: { name: 'asc' },
    create: z.object({
      countryId: z.string().uuid(),
      regionId: optionalId,
      name: z.string().min(1).max(160),
      slug: z.string().min(1).max(120),
      lat: z.coerce.number().min(34).max(75).nullish(),
      lng: z.coerce.number().min(-25).max(60).nullish(),
      population: z.coerce.number().int().nonnegative().nullish(),
    }),
  },
  programs: {
    delegate: 'conservationProgram',
    label: 'Программы',
    entityType: 'program',
    publishable: true,
    searchFields: ['name', 'slug'],
    orderBy: { name: 'asc' },
    relations: ['species', 'zoos'],
    create: z.object({
      slug: z.string().min(1).max(120),
      name: z.string().min(1).max(200),
      code: z.enum(['EEP', 'ESB', 'STUDBOOK', 'OTHER']),
      organizationId: optionalId,
      startedYear: optionalYear,
      endedYear: optionalYear,
      status: z.enum(['active', 'completed', 'suspended']).default('active'),
      publishStatus: z.enum(['draft', 'review', 'published']).default('draft'),
      description: optionalText,
    }),
  },
  organizations: {
    delegate: 'organization',
    label: 'Организации',
    entityType: 'organization',
    publishable: true,
    searchFields: ['name', 'acronym', 'slug'],
    orderBy: { name: 'asc' },
    relations: ['zoos'],
    create: z.object({
      slug: z.string().min(1).max(120),
      name: z.string().min(1).max(200),
      acronym: z.string().max(40).nullish(),
      type: z.enum(['association', 'program_operator', 'conservation', 'research', 'government']),
      countryId: optionalId,
      foundedYear: optionalYear,
      website: z.string().url().nullish(),
      description: optionalText,
      publishStatus: z.enum(['draft', 'review', 'published']).default('published'),
    }),
  },
  research: {
    delegate: 'researchProject',
    label: 'Исследования',
    entityType: 'research',
    publishable: true,
    searchFields: ['title', 'slug'],
    orderBy: { title: 'asc' },
    relations: ['zoos', 'species'],
    create: z.object({
      slug: z.string().min(1).max(120),
      title: z.string().min(3).max(250),
      summary: optionalText,
      startedYear: optionalYear,
      endedYear: optionalYear,
      status: z.enum(['active', 'completed', 'planned', 'cancelled']).default('active'),
      publishStatus: z.enum(['draft', 'review', 'published']).default('draft'),
      leadOrganizationId: optionalId,
    }),
  },
  education: {
    delegate: 'educationProgram',
    label: 'Образовательные программы',
    entityType: 'education',
    publishable: false,
    searchFields: ['title'],
    orderBy: { title: 'asc' },
    create: z.object({
      zooId: z.string().uuid(),
      title: z.string().min(3).max(200),
      audience: z.enum(['children', 'schools', 'adults', 'families', 'professionals']),
      format: z.enum(['tour', 'workshop', 'lecture', 'course', 'exhibition']),
      description: optionalText,
      url: z.string().url().nullish(),
    }),
  },
  facilities: {
    delegate: 'facility',
    label: 'Инфраструктура',
    entityType: 'facility',
    publishable: false,
    searchFields: ['name', 'slug'],
    orderBy: { name: 'asc' },
    create: z.object({
      slug: z.string().min(1).max(120),
      name: z.string().min(1).max(160),
      category: z.enum([
        'parking',
        'cafe',
        'playground',
        'accessibility',
        'shop',
        'medical',
        'transport',
      ]),
    }),
  },
  events: {
    delegate: 'zooEvent',
    label: 'События истории',
    entityType: 'event',
    publishable: false,
    searchFields: ['title'],
    orderBy: { year: 'asc' },
    create: z.object({
      zooId: z.string().uuid(),
      year: z.coerce.number().int().min(1200).max(2100),
      exactDate: z.coerce.date().nullish(),
      type: z.enum(['founded', 'opened', 'reopened', 'closed', 'expansion', 'renovation', 'award']),
      title: z.string().min(3).max(200),
      description: optionalText,
    }),
  },
  news: {
    delegate: 'zooNews',
    label: 'Новости зоопарков',
    publishable: false,
    searchFields: ['title', 'summary'],
    orderBy: { publishedAt: 'desc' },
    create: z.object({
      zooId: z.string().uuid(),
      title: z.string().min(3).max(250),
      summary: optionalText,
      url: z.string().url(),
      sourceName: z.string().max(160).nullish(),
      publishedAt: z.coerce.date(),
      publishStatus: z.enum(['draft', 'review', 'published']).default('draft'),
      verifiedAt: z.coerce.date().nullish(),
    }),
  },
  sources: {
    delegate: 'source',
    label: 'Источники',
    entityType: 'source',
    publishable: false,
    searchFields: ['title', 'url', 'publisher'],
    orderBy: { title: 'asc' },
    create: z.object({
      type: z.enum(['official_site', 'scientific', 'database', 'media', 'community']),
      title: z.string().min(3).max(250),
      url: z.string().url(),
      publisher: optionalText,
      publishedAt: z.coerce.date().nullish(),
      accessedAt: z.coerce.date(),
      license: optionalText,
      reliability: z.enum(['official', 'scientific', 'database', 'media', 'community']),
    }),
  },
  synonyms: {
    delegate: 'searchSynonym',
    label: 'Синонимы поиска',
    entityType: 'source',
    publishable: false,
    searchFields: ['term', 'synonym'],
    orderBy: { term: 'asc' },
    create: z.object({
      term: z.string().min(1).max(120),
      synonym: z.string().min(1).max(120),
      language: z.string().length(2).default('ru'),
      weight: z.coerce.number().min(0).max(10).default(1),
    }),
  },
};

export function resourceConfig(name: string): ResourceConfig {
  const config = RESOURCES[name];
  if (!config) throw new Error(`Unknown resource ${name}`);
  return config;
}
