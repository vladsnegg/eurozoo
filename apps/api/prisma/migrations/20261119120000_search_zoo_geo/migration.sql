-- Поиск: в документ зоопарка добавляются город и страна, чтобы запросы
-- «Вена», «Прага» находили зоопарки, а не только географические сущности.
-- В русский tsvector организации добавлен акроним (EAZA, WAZA, IUCN).
DROP MATERIALIZED VIEW IF EXISTS "mv_search_index";

CREATE MATERIALIZED VIEW "mv_search_index" AS
SELECT 'zoo'::text AS entity_type, z.id AS entity_id, z.slug,
       z.name AS title,
       concat_ws(' · ', c.name, co.name) AS subtitle,
       concat_ws(' ', z.name, z.name_local, z.description, c.name, co.name) AS body,
       to_tsvector('russian', concat_ws(' ', z.name, z.name_local, coalesce(z.description, ''), c.name, co.name)) ||
       to_tsvector('english', concat_ws(' ', z.name, z.name_local, coalesce(z.description, ''), c.name, co.name)) AS tsv,
       z.updated_at
FROM "zoo" z
JOIN "city" c ON c.id = z.city_id
JOIN "country" co ON co.id = c.country_id
WHERE z.publish_status = 'published'
UNION ALL
SELECT 'species', t.id, t.slug, t.scientific_name,
       NULLIF(concat_ws(' · ', t.common_name_ru, t.common_name_en), ''),
       concat_ws(' ', t.scientific_name, t.common_name_ru, t.common_name_en, t.description,
                 sp.habitat_summary, sp.diet_summary, genus.scientific_name, family.scientific_name,
                 genus.common_name_ru, family.common_name_ru),
       to_tsvector('russian', concat_ws(' ', coalesce(t.common_name_ru, ''), coalesce(t.description, ''),
                 coalesce(sp.habitat_summary, ''), coalesce(genus.common_name_ru, ''), coalesce(family.common_name_ru, ''))) ||
       to_tsvector('english', concat_ws(' ', t.scientific_name, coalesce(t.common_name_en, ''),
                 coalesce(t.description, ''), coalesce(sp.habitat_summary, ''),
                 coalesce(genus.scientific_name, ''), coalesce(family.scientific_name, ''))),
       now()
FROM "taxon" t
LEFT JOIN "species_profile" sp ON sp.taxon_id = t.id
LEFT JOIN "taxon" genus ON genus.id = t.parent_id
LEFT JOIN "taxon" family ON family.id = genus.parent_id
JOIN "taxonomic_rank" r ON r.id = t.rank_id AND r.code = 'species'
UNION ALL
SELECT 'country', co.id, co.slug, co.name, co.name_local,
       concat_ws(' ', co.name, co.name_local, co.iso2, co.iso3),
       to_tsvector('russian', concat_ws(' ', co.name, coalesce(co.name_local, ''))) ||
       to_tsvector('english', concat_ws(' ', co.name, coalesce(co.name_local, ''))),
       now()
FROM "country" co
UNION ALL
SELECT 'city', c.id, c.slug, c.name, co.name,
       concat_ws(' ', c.name, co.name),
       to_tsvector('russian', c.name) || to_tsvector('english', c.name),
       now()
FROM "city" c
JOIN "country" co ON co.id = c.country_id
UNION ALL
SELECT 'program', p.id, p.slug, p.name, org.name,
       concat_ws(' ', p.name, p.description, p.code::text, p.slug),
       to_tsvector('russian', concat_ws(' ', p.name, coalesce(p.description, ''), p.code::text, p.slug)) ||
       to_tsvector('english', concat_ws(' ', p.name, coalesce(p.description, ''), p.code::text, p.slug)),
       now()
FROM "conservation_program" p
LEFT JOIN "organization" org ON org.id = p.organization_id
WHERE p.publish_status = 'published'
UNION ALL
SELECT 'organization', o.id, o.slug, o.name, o.acronym,
       concat_ws(' ', o.name, o.acronym, o.slug, o.description),
       to_tsvector('russian', concat_ws(' ', o.name, coalesce(o.acronym, ''), o.slug, coalesce(o.description, ''))) ||
       to_tsvector('english', concat_ws(' ', o.name, coalesce(o.acronym, ''), o.slug, coalesce(o.description, ''))),
       now()
FROM "organization" o
WHERE o.publish_status = 'published'
UNION ALL
SELECT 'research', rp.id, rp.slug, rp.title, org.name,
       concat_ws(' ', rp.title, rp.summary),
       to_tsvector('russian', concat_ws(' ', rp.title, coalesce(rp.summary, ''))) ||
       to_tsvector('english', concat_ws(' ', rp.title, coalesce(rp.summary, ''))),
       now()
FROM "research_project" rp
LEFT JOIN "organization" org ON org.id = rp.lead_organization_id
WHERE rp.publish_status = 'published';

CREATE UNIQUE INDEX "mv_search_index_entity_idx" ON "mv_search_index" ("entity_type", "entity_id");
CREATE INDEX "mv_search_index_tsv_idx" ON "mv_search_index" USING GIN ("tsv");
CREATE INDEX "mv_search_index_title_trgm_idx" ON "mv_search_index" USING GIN ("title" gin_trgm_ops);
