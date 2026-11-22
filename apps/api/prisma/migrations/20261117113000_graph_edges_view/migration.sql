-- Единое представление рёбер графа знаний: структурные связи + knowledge_edge + вывод R3.
-- Все рёбра направленные; обход в GraphService выполняется по обоим направлениям.
CREATE OR REPLACE VIEW "v_all_edges" AS
SELECT 'zoo'::text AS src_type, z.id AS src_id, 'city'::text AS dst_type, z.city_id AS dst_id,
       'LOCATED_IN'::text AS predicate, 1.0::float8 AS confidence, false AS inferred
FROM "zoo" z WHERE z.publish_status = 'published'
UNION ALL
SELECT 'zoo', zs.zoo_id, 'species', zs.taxon_id, 'KEEPS', 1.0, false
FROM "zoo_species" zs
JOIN "zoo" z ON z.id = zs.zoo_id AND z.publish_status = 'published'
UNION ALL
SELECT 'zoo', zp.zoo_id, 'program', zp.program_id, 'PARTICIPATES_IN', 1.0, false
FROM "zoo_program" zp
JOIN "zoo" z ON z.id = zp.zoo_id AND z.publish_status = 'published'
UNION ALL
SELECT 'zoo', zo.zoo_id, 'organization', zo.organization_id, 'MEMBER_OF', 1.0, false
FROM "zoo_organization" zo
JOIN "zoo" z ON z.id = zo.zoo_id AND z.publish_status = 'published'
UNION ALL
SELECT 'zoo', zr.zoo_id, 'research', zr.research_project_id, 'CONDUCTS', 1.0, false
FROM "zoo_research" zr
JOIN "zoo" z ON z.id = zr.zoo_id AND z.publish_status = 'published'
UNION ALL
SELECT 'species', t.id, 'taxon', t.parent_id, 'PART_OF', 1.0, false
FROM "taxon" t
WHERE t.parent_id IS NOT NULL AND t.publish_status = 'published'
UNION ALL
SELECT 'program', p.id, 'organization', p.organization_id, 'OPERATES', 1.0, false
FROM "conservation_program" p
WHERE p.organization_id IS NOT NULL AND p.publish_status = 'published'
UNION ALL
SELECT 'program', ps.program_id, 'species', ps.taxon_id, 'TARGETS', 1.0, false
FROM "program_species" ps
JOIN "conservation_program" p ON p.id = ps.program_id AND p.publish_status = 'published'
UNION ALL
SELECT 'organization', zo.organization_id, 'zoo', zo.zoo_id, 'MEMBER_OF', 1.0, false
FROM "zoo_organization" zo
JOIN "organization" o ON o.id = zo.organization_id AND o.publish_status = 'published'
JOIN "zoo" z ON z.id = zo.zoo_id AND z.publish_status = 'published'
UNION ALL
SELECT 'research', zr.research_project_id, 'zoo', zr.zoo_id, 'CONDUCTS', 1.0, false
FROM "zoo_research" zr
JOIN "research_project" rp ON rp.id = zr.research_project_id AND rp.publish_status = 'published'
JOIN "zoo" z ON z.id = zr.zoo_id AND z.publish_status = 'published'
UNION ALL
SELECT 'research', rs.research_project_id, 'species', rs.taxon_id, 'STUDIES', 1.0, false
FROM "research_species" rs
JOIN "research_project" rp ON rp.id = rs.research_project_id AND rp.publish_status = 'published'
UNION ALL
SELECT 'city', c.id, 'country', c.country_id, 'CITY_IN_COUNTRY', 1.0, false
FROM "city" c
UNION ALL
SELECT 'zoo', v.zoo_id, 'species', v.taxon_id, 'INFERRED_PROGRAM_SPECIES', 0.8, true
FROM "v_zoo_program_species" v
JOIN "zoo" z ON z.id = v.zoo_id AND z.publish_status = 'published'
UNION ALL
SELECT (e.src_type)::text, e.src_id, (e.dst_type)::text, e.dst_id, e.predicate, coalesce(e.confidence, 0.8), false
FROM "knowledge_edge" e;
