import { z } from 'zod';

const enumOf = <T extends readonly [string, ...string[]]>(values: T) => z.enum(values);

export const zooStatusSchema = enumOf(['active', 'closed', 'planned']);
export const publishStatusSchema = enumOf(['draft', 'review', 'published']);
export const eventTypeSchema = enumOf([
  'founded',
  'opened',
  'reopened',
  'closed',
  'expansion',
  'renovation',
  'award',
]);
export const enclosureTypeSchema = enumOf(['indoor', 'outdoor', 'mixed', 'aquarium', 'aviary']);
export const biomeSchema = enumOf([
  'forest',
  'grassland',
  'desert',
  'tundra',
  'aquatic',
  'wetland',
  'mountain',
  'savanna',
  'coastal',
]);
export const trendSchema = enumOf(['increasing', 'decreasing', 'stable', 'unknown']);
export const programCodeSchema = enumOf(['EEP', 'ESB', 'STUDBOOK', 'OTHER']);
export const programStatusSchema = enumOf(['active', 'completed', 'suspended']);
export const participationRoleSchema = enumOf(['coordinator', 'participant', 'former']);
export const programRoleSchema = enumOf(['target', 'flagship', 'candidate']);
export const orgTypeSchema = enumOf([
  'association',
  'program_operator',
  'conservation',
  'research',
  'government',
]);
export const researchStatusSchema = enumOf(['active', 'completed', 'planned', 'cancelled']);
export const audienceSchema = enumOf(['children', 'schools', 'adults', 'families', 'professionals']);
export const educationFormatSchema = enumOf(['tour', 'workshop', 'lecture', 'course', 'exhibition']);
export const facilityCategorySchema = enumOf([
  'parking',
  'cafe',
  'playground',
  'accessibility',
  'shop',
  'medical',
  'transport',
]);
export const sourceTypeSchema = enumOf([
  'official_site',
  'scientific',
  'database',
  'media',
  'community',
]);
export const reliabilitySchema = enumOf([
  'official',
  'scientific',
  'database',
  'media',
  'community',
]);
export const provenanceStatusSchema = enumOf(['current', 'stale', 'disputed']);
export const userRoleSchema = enumOf(['viewer', 'editor', 'admin']);
export const entityTypeSchema = enumOf([
  'zoo',
  'species',
  'taxon',
  'country',
  'region',
  'city',
  'program',
  'organization',
  'research',
  'event',
  'education',
  'facility',
]);

export type ZooStatus = z.infer<typeof zooStatusSchema>;
export type PublishStatus = z.infer<typeof publishStatusSchema>;
export type EntityType = z.infer<typeof entityTypeSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type ProgramCode = z.infer<typeof programCodeSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;
export type Reliability = z.infer<typeof reliabilitySchema>;
