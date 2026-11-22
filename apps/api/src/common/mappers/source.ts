import type { Prisma, Source } from '@prisma/client';
import type { ProvenanceDto, SourceDto } from '@eurozoo/shared';
import { toDateISO } from '../http/query';

export type EntitySourceRow = Prisma.EntitySourceGetPayload<{ include: { source: true } }>;

export function sourceToDto(source: Source): SourceDto {
  return {
    id: source.id,
    type: source.type,
    title: source.title,
    url: source.url,
    publisher: source.publisher,
    publishedAt: toDateISO(source.publishedAt),
    accessedAt: toDateISO(source.accessedAt) ?? '',
    license: source.license,
    reliability: source.reliability,
  };
}

export function toSourceDto(link: EntitySourceRow): SourceDto {
  return sourceToDto(link.source);
}

export function toProvenanceDto(link: EntitySourceRow): ProvenanceDto {
  return {
    sourceId: link.source.id,
    title: link.source.title,
    url: link.source.url,
    publisher: link.source.publisher,
    type: link.source.type,
    reliability: link.source.reliability,
    confidence: link.confidence,
    retrievedAt: toDateISO(link.retrievedAt),
    verifiedAt: toDateISO(link.verifiedAt),
    status: link.status,
  };
}
