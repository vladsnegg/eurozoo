-- CreateEnum
CREATE TYPE "ZooStatus" AS ENUM ('active', 'closed', 'planned');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('draft', 'review', 'published');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('founded', 'opened', 'reopened', 'closed', 'expansion', 'renovation', 'award');

-- CreateEnum
CREATE TYPE "EnclosureType" AS ENUM ('indoor', 'outdoor', 'mixed', 'aquarium', 'aviary');

-- CreateEnum
CREATE TYPE "Biome" AS ENUM ('forest', 'grassland', 'desert', 'tundra', 'aquatic', 'wetland', 'mountain', 'savanna', 'coastal');

-- CreateEnum
CREATE TYPE "Trend" AS ENUM ('increasing', 'decreasing', 'stable', 'unknown');

-- CreateEnum
CREATE TYPE "ProgramCode" AS ENUM ('EEP', 'ESB', 'STUDBOOK', 'OTHER');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('active', 'completed', 'suspended');

-- CreateEnum
CREATE TYPE "ParticipationRole" AS ENUM ('coordinator', 'participant', 'former');

-- CreateEnum
CREATE TYPE "ProgramRole" AS ENUM ('target', 'flagship', 'candidate');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('association', 'program_operator', 'conservation', 'research', 'government');

-- CreateEnum
CREATE TYPE "ResearchStatus" AS ENUM ('active', 'completed', 'planned', 'cancelled');

-- CreateEnum
CREATE TYPE "Audience" AS ENUM ('children', 'schools', 'adults', 'families', 'professionals');

-- CreateEnum
CREATE TYPE "EducationFormat" AS ENUM ('tour', 'workshop', 'lecture', 'course', 'exhibition');

-- CreateEnum
CREATE TYPE "FacilityCategory" AS ENUM ('parking', 'cafe', 'playground', 'accessibility', 'shop', 'medical', 'transport');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('official_site', 'scientific', 'database', 'media', 'community');

-- CreateEnum
CREATE TYPE "Reliability" AS ENUM ('official', 'scientific', 'database', 'media', 'community');

-- CreateEnum
CREATE TYPE "ProvenanceStatus" AS ENUM ('current', 'stale', 'disputed');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('viewer', 'editor', 'admin');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('zoo', 'species', 'taxon', 'country', 'region', 'city', 'program', 'organization', 'research', 'event', 'education', 'facility');

-- CreateTable
CREATE TABLE "country" (
    "id" UUID NOT NULL,
    "iso2" CHAR(2) NOT NULL,
    "iso3" CHAR(3) NOT NULL,
    "name" TEXT NOT NULL,
    "name_local" TEXT,
    "slug" TEXT NOT NULL,
    "eu_member" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "region" (
    "id" UUID NOT NULL,
    "country_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city" (
    "id" UUID NOT NULL,
    "country_id" UUID NOT NULL,
    "region_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "population" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zoo" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_local" TEXT,
    "city_id" UUID NOT NULL,
    "founded_year" INTEGER,
    "area_ha" DOUBLE PRECISION,
    "annual_visitors" INTEGER,
    "website" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "description" TEXT,
    "status" "ZooStatus" NOT NULL DEFAULT 'active',
    "publish_status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zoo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zoo_event" (
    "id" UUID NOT NULL,
    "zoo_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "exact_date" DATE,
    "type" "EventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "zoo_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enclosure" (
    "id" UUID NOT NULL,
    "zoo_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EnclosureType",
    "area_m2" DOUBLE PRECISION,
    "habitat_id" UUID,
    "description" TEXT,

    CONSTRAINT "enclosure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "FacilityCategory" NOT NULL,

    CONSTRAINT "facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zoo_facility" (
    "zoo_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "note" TEXT,

    CONSTRAINT "zoo_facility_pkey" PRIMARY KEY ("zoo_id","facility_id")
);

-- CreateTable
CREATE TABLE "taxonomic_rank" (
    "id" SMALLINT NOT NULL,
    "code" TEXT NOT NULL,
    "name_ru" TEXT NOT NULL,
    "level" SMALLINT NOT NULL,

    CONSTRAINT "taxonomic_rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxon" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "rank_id" SMALLINT NOT NULL,
    "parent_id" UUID,
    "scientific_name" TEXT NOT NULL,
    "common_name_ru" TEXT,
    "common_name_en" TEXT,
    "authority" TEXT,
    "year_described" INTEGER,
    "gbif_key" BIGINT,
    "description" TEXT,

    CONSTRAINT "taxon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "species_profile" (
    "taxon_id" UUID NOT NULL,
    "iucn_status_id" SMALLINT,
    "population_trend" "Trend",
    "habitat_summary" TEXT,
    "diet_summary" TEXT,
    "lifespan_years" DOUBLE PRECISION,
    "weight_kg_min" DOUBLE PRECISION,
    "weight_kg_max" DOUBLE PRECISION,
    "length_cm_min" DOUBLE PRECISION,
    "length_cm_max" DOUBLE PRECISION,
    "description" TEXT,

    CONSTRAINT "species_profile_pkey" PRIMARY KEY ("taxon_id")
);

-- CreateTable
CREATE TABLE "iucn_status" (
    "id" SMALLINT NOT NULL,
    "code" TEXT NOT NULL,
    "name_ru" TEXT NOT NULL,
    "severity" SMALLINT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "iucn_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habitat" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "biome" "Biome" NOT NULL,
    "description" TEXT,

    CONSTRAINT "habitat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "species_habitat" (
    "taxon_id" UUID NOT NULL,
    "habitat_id" UUID NOT NULL,

    CONSTRAINT "species_habitat_pkey" PRIMARY KEY ("taxon_id","habitat_id")
);

-- CreateTable
CREATE TABLE "conservation_program" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "code" "ProgramCode" NOT NULL,
    "name" TEXT NOT NULL,
    "organization_id" UUID,
    "started_year" INTEGER,
    "ended_year" INTEGER,
    "status" "ProgramStatus" NOT NULL DEFAULT 'active',
    "description" TEXT,

    CONSTRAINT "conservation_program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_species" (
    "program_id" UUID NOT NULL,
    "taxon_id" UUID NOT NULL,
    "role" "ProgramRole" NOT NULL DEFAULT 'target',

    CONSTRAINT "program_species_pkey" PRIMARY KEY ("program_id","taxon_id")
);

-- CreateTable
CREATE TABLE "zoo_program" (
    "zoo_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "role" "ParticipationRole" NOT NULL DEFAULT 'participant',
    "since_year" INTEGER,
    "until_year" INTEGER,

    CONSTRAINT "zoo_program_pkey" PRIMARY KEY ("zoo_id","program_id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "acronym" TEXT,
    "type" "OrgType" NOT NULL,
    "country_id" UUID,
    "founded_year" INTEGER,
    "website" TEXT,
    "description" TEXT,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zoo_organization" (
    "zoo_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role" TEXT,
    "since_year" INTEGER,
    "until_year" INTEGER,

    CONSTRAINT "zoo_organization_pkey" PRIMARY KEY ("zoo_id","organization_id")
);

-- CreateTable
CREATE TABLE "zoo_species" (
    "zoo_id" UUID NOT NULL,
    "taxon_id" UUID NOT NULL,
    "count_male" INTEGER,
    "count_female" INTEGER,
    "count_unsexed" INTEGER,
    "since_year" INTEGER,
    "breeding" BOOLEAN NOT NULL DEFAULT false,
    "enclosure_id" UUID,
    "note" TEXT,

    CONSTRAINT "zoo_species_pkey" PRIMARY KEY ("zoo_id","taxon_id")
);

-- CreateTable
CREATE TABLE "research_project" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "started_year" INTEGER,
    "ended_year" INTEGER,
    "status" "ResearchStatus" NOT NULL DEFAULT 'active',
    "lead_organization_id" UUID,

    CONSTRAINT "research_project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zoo_research" (
    "zoo_id" UUID NOT NULL,
    "research_project_id" UUID NOT NULL,

    CONSTRAINT "zoo_research_pkey" PRIMARY KEY ("zoo_id","research_project_id")
);

-- CreateTable
CREATE TABLE "research_species" (
    "research_project_id" UUID NOT NULL,
    "taxon_id" UUID NOT NULL,

    CONSTRAINT "research_species_pkey" PRIMARY KEY ("research_project_id","taxon_id")
);

-- CreateTable
CREATE TABLE "education_program" (
    "id" UUID NOT NULL,
    "zoo_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "audience" "Audience" NOT NULL,
    "format" "EducationFormat" NOT NULL,
    "description" TEXT,
    "url" TEXT,

    CONSTRAINT "education_program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source" (
    "id" UUID NOT NULL,
    "type" "SourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publisher" TEXT,
    "published_at" DATE,
    "accessed_at" DATE NOT NULL,
    "license" TEXT,
    "reliability" "Reliability" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_source" (
    "id" UUID NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "field_name" TEXT NOT NULL DEFAULT '',
    "confidence" DOUBLE PRECISION,
    "retrieved_at" DATE,
    "verified_at" DATE,
    "status" "ProvenanceStatus" NOT NULL DEFAULT 'current',

    CONSTRAINT "entity_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predicate" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label_ru" TEXT NOT NULL,
    "domain_type" "EntityType" NOT NULL,
    "range_type" "EntityType" NOT NULL,
    "cardinality" TEXT NOT NULL,
    "is_transitive" BOOLEAN NOT NULL DEFAULT false,
    "is_inferred" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "predicate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_edge" (
    "id" UUID NOT NULL,
    "src_type" "EntityType" NOT NULL,
    "src_id" UUID NOT NULL,
    "predicate" TEXT NOT NULL,
    "dst_type" "EntityType" NOT NULL,
    "dst_id" UUID NOT NULL,
    "confidence" DOUBLE PRECISION,
    "source_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_edge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'viewer',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "ip" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_revision" (
    "id" BIGSERIAL NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "diff" JSONB,
    "actor_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_revision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "country_iso2_key" ON "country"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "country_iso3_key" ON "country"("iso3");

-- CreateIndex
CREATE UNIQUE INDEX "country_slug_key" ON "country"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "region_country_id_slug_key" ON "region"("country_id", "slug");

-- CreateIndex
CREATE INDEX "city_region_id_idx" ON "city"("region_id");

-- CreateIndex
CREATE UNIQUE INDEX "city_country_id_slug_key" ON "city"("country_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "zoo_slug_key" ON "zoo"("slug");

-- CreateIndex
CREATE INDEX "zoo_city_id_idx" ON "zoo"("city_id");

-- CreateIndex
CREATE INDEX "zoo_publish_status_idx" ON "zoo"("publish_status");

-- CreateIndex
CREATE INDEX "zoo_event_zoo_id_year_idx" ON "zoo_event"("zoo_id", "year");

-- CreateIndex
CREATE INDEX "enclosure_zoo_id_idx" ON "enclosure"("zoo_id");

-- CreateIndex
CREATE UNIQUE INDEX "facility_slug_key" ON "facility"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "taxonomic_rank_code_key" ON "taxonomic_rank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "taxonomic_rank_level_key" ON "taxonomic_rank"("level");

-- CreateIndex
CREATE UNIQUE INDEX "taxon_slug_key" ON "taxon"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "taxon_scientific_name_key" ON "taxon"("scientific_name");

-- CreateIndex
CREATE INDEX "taxon_parent_id_idx" ON "taxon"("parent_id");

-- CreateIndex
CREATE INDEX "taxon_rank_id_idx" ON "taxon"("rank_id");

-- CreateIndex
CREATE UNIQUE INDEX "iucn_status_code_key" ON "iucn_status"("code");

-- CreateIndex
CREATE UNIQUE INDEX "iucn_status_severity_key" ON "iucn_status"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "habitat_slug_key" ON "habitat"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "conservation_program_slug_key" ON "conservation_program"("slug");

-- CreateIndex
CREATE INDEX "conservation_program_organization_id_idx" ON "conservation_program"("organization_id");

-- CreateIndex
CREATE INDEX "program_species_taxon_id_idx" ON "program_species"("taxon_id");

-- CreateIndex
CREATE INDEX "zoo_program_program_id_idx" ON "zoo_program"("program_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organization_acronym_key" ON "organization"("acronym");

-- CreateIndex
CREATE INDEX "organization_country_id_idx" ON "organization"("country_id");

-- CreateIndex
CREATE INDEX "zoo_organization_organization_id_idx" ON "zoo_organization"("organization_id");

-- CreateIndex
CREATE INDEX "zoo_species_taxon_id_idx" ON "zoo_species"("taxon_id");

-- CreateIndex
CREATE UNIQUE INDEX "research_project_slug_key" ON "research_project"("slug");

-- CreateIndex
CREATE INDEX "zoo_research_research_project_id_idx" ON "zoo_research"("research_project_id");

-- CreateIndex
CREATE INDEX "research_species_taxon_id_idx" ON "research_species"("taxon_id");

-- CreateIndex
CREATE INDEX "education_program_zoo_id_idx" ON "education_program"("zoo_id");

-- CreateIndex
CREATE INDEX "source_type_idx" ON "source"("type");

-- CreateIndex
CREATE INDEX "entity_source_entity_type_entity_id_idx" ON "entity_source"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_source_entity_type_entity_id_source_id_field_name_key" ON "entity_source"("entity_type", "entity_id", "source_id", "field_name");

-- CreateIndex
CREATE UNIQUE INDEX "predicate_code_key" ON "predicate"("code");

-- CreateIndex
CREATE INDEX "knowledge_edge_src_type_src_id_idx" ON "knowledge_edge"("src_type", "src_id");

-- CreateIndex
CREATE INDEX "knowledge_edge_dst_type_dst_id_idx" ON "knowledge_edge"("dst_type", "dst_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_edge_src_type_src_id_predicate_dst_type_dst_id_key" ON "knowledge_edge"("src_type", "src_id", "predicate", "dst_type", "dst_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_hash_key" ON "session"("token_hash");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "session_expires_at_idx" ON "session"("expires_at");

-- CreateIndex
CREATE INDEX "knowledge_revision_entity_type_entity_id_idx" ON "knowledge_revision"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "knowledge_revision_actor_id_idx" ON "knowledge_revision"("actor_id");

-- AddForeignKey
ALTER TABLE "region" ADD CONSTRAINT "region_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city" ADD CONSTRAINT "city_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city" ADD CONSTRAINT "city_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zoo" ADD CONSTRAINT "zoo_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zoo_event" ADD CONSTRAINT "zoo_event_zoo_id_fkey" FOREIGN KEY ("zoo_id") REFERENCES "zoo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enclosure" ADD CONSTRAINT "enclosure_zoo_id_fkey" FOREIGN KEY ("zoo_id") REFERENCES "zoo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enclosure" ADD CONSTRAINT "enclosure_habitat_id_fkey" FOREIGN KEY ("habitat_id") REFERENCES "habitat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zoo_facility" ADD CONSTRAINT "zoo_facility_zoo_id_fkey" FOREIGN KEY ("zoo_id") REFERENCES "zoo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zoo_facility" ADD CONSTRAINT "zoo_facility_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxon" ADD CONSTRAINT "taxon_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "taxonomic_rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxon" ADD CONSTRAINT "taxon_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "taxon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "species_profile" ADD CONSTRAINT "species_profile_taxon_id_fkey" FOREIGN KEY ("taxon_id") REFERENCES "taxon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "species_profile" ADD CONSTRAINT "species_profile_iucn_status_id_fkey" FOREIGN KEY ("iucn_status_id") REFERENCES "iucn_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "species_habitat" ADD CONSTRAINT "species_habitat_taxon_id_fkey" FOREIGN KEY ("taxon_id") REFERENCES "taxon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "species_habitat" ADD CONSTRAINT "species_habitat_habitat_id_fkey" FOREIGN KEY ("habitat_id") REFERENCES "habitat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conservation_program" ADD CONSTRAINT "conservation_program_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_species" ADD CONSTRAINT "program_species_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "conservation_program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_species" ADD CONSTRAINT "program_species_taxon_id_fkey" FOREIGN KEY ("taxon_id") REFERENCES "taxon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zoo_program" ADD CONSTRAINT "zoo_program_zoo_id_fkey" FOREIGN KEY ("zoo_id") REFERENCES "zoo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zoo_program" ADD CONSTRAINT "zoo_program_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "conservation_program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization" ADD CONSTRAINT "organization_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zoo_organization" ADD CONSTRAINT "zoo_organization_zoo_id_fkey" FOREIGN KEY ("zoo_id") REFERENCES "zoo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zoo_organization" ADD CONSTRAINT "zoo_organization_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zoo_species" ADD CONSTRAINT "zoo_species_zoo_id_fkey" FOREIGN KEY ("zoo_id") REFERENCES "zoo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zoo_species" ADD CONSTRAINT "zoo_species_taxon_id_fkey" FOREIGN KEY ("taxon_id") REFERENCES "taxon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zoo_species" ADD CONSTRAINT "zoo_species_enclosure_id_fkey" FOREIGN KEY ("enclosure_id") REFERENCES "enclosure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_project" ADD CONSTRAINT "research_project_lead_organization_id_fkey" FOREIGN KEY ("lead_organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zoo_research" ADD CONSTRAINT "zoo_research_zoo_id_fkey" FOREIGN KEY ("zoo_id") REFERENCES "zoo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zoo_research" ADD CONSTRAINT "zoo_research_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_species" ADD CONSTRAINT "research_species_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_species" ADD CONSTRAINT "research_species_taxon_id_fkey" FOREIGN KEY ("taxon_id") REFERENCES "taxon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_program" ADD CONSTRAINT "education_program_zoo_id_fkey" FOREIGN KEY ("zoo_id") REFERENCES "zoo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_source" ADD CONSTRAINT "entity_source_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_edge" ADD CONSTRAINT "knowledge_edge_predicate_fkey" FOREIGN KEY ("predicate") REFERENCES "predicate"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_edge" ADD CONSTRAINT "knowledge_edge_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_revision" ADD CONSTRAINT "knowledge_revision_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- EuroZoo Atlas: расширения, доменные ограничения, индексы,
-- представления правил вывода R1-R6 и индекс поиска.
-- Добавлено вручную к сгенерированной Prisma миграции (ЭТАП 3).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------- CHECK-ограничения ----------

ALTER TABLE "country" ADD CONSTRAINT "country_iso2_format" CHECK ("iso2" ~ '^[A-Z]{2}$');
ALTER TABLE "country" ADD CONSTRAINT "country_iso3_format" CHECK ("iso3" ~ '^[A-Z]{3}$');

ALTER TABLE "city" ADD CONSTRAINT "city_coords_europe" CHECK (
  ("lat" IS NULL OR ("lat" >= 34 AND "lat" <= 72)) AND
  ("lng" IS NULL OR ("lng" >= -25 AND "lng" <= 45))
);
ALTER TABLE "city" ADD CONSTRAINT "city_population_nonneg" CHECK ("population" IS NULL OR "population" >= 0);

ALTER TABLE "zoo" ADD CONSTRAINT "zoo_founded_year_range" CHECK ("founded_year" IS NULL OR "founded_year" BETWEEN 1200 AND 2100);
ALTER TABLE "zoo" ADD CONSTRAINT "zoo_area_positive" CHECK ("area_ha" IS NULL OR "area_ha" > 0);
ALTER TABLE "zoo" ADD CONSTRAINT "zoo_visitors_nonneg" CHECK ("annual_visitors" IS NULL OR "annual_visitors" >= 0);
ALTER TABLE "zoo" ADD CONSTRAINT "zoo_coords_europe" CHECK (
  ("lat" IS NULL OR ("lat" >= 34 AND "lat" <= 72)) AND
  ("lng" IS NULL OR ("lng" >= -25 AND "lng" <= 45))
);
ALTER TABLE "zoo" ADD CONSTRAINT "zoo_website_format" CHECK ("website" IS NULL OR "website" ~ '^https?://');

ALTER TABLE "zoo_event" ADD CONSTRAINT "zoo_event_year_range" CHECK ("year" BETWEEN 1200 AND 2100);

ALTER TABLE "enclosure" ADD CONSTRAINT "enclosure_area_positive" CHECK ("area_m2" IS NULL OR "area_m2" > 0);

ALTER TABLE "taxon" ADD CONSTRAINT "taxon_no_self_parent" CHECK ("parent_id" IS NULL OR "parent_id" <> "id");
ALTER TABLE "taxon" ADD CONSTRAINT "taxon_year_range" CHECK ("year_described" IS NULL OR "year_described" BETWEEN 1200 AND 2100);

ALTER TABLE "species_profile" ADD CONSTRAINT "species_weight_range" CHECK (
  "weight_kg_min" IS NULL OR "weight_kg_max" IS NULL OR "weight_kg_min" <= "weight_kg_max"
);
ALTER TABLE "species_profile" ADD CONSTRAINT "species_length_range" CHECK (
  "length_cm_min" IS NULL OR "length_cm_max" IS NULL OR "length_cm_min" <= "length_cm_max"
);
ALTER TABLE "species_profile" ADD CONSTRAINT "species_lifespan_positive" CHECK ("lifespan_years" IS NULL OR "lifespan_years" > 0);

ALTER TABLE "conservation_program" ADD CONSTRAINT "program_years_order" CHECK (
  "ended_year" IS NULL OR "started_year" IS NULL OR "ended_year" >= "started_year"
);
ALTER TABLE "zoo_program" ADD CONSTRAINT "zoo_program_years_order" CHECK (
  "until_year" IS NULL OR "since_year" IS NULL OR "until_year" >= "since_year"
);

ALTER TABLE "zoo_species" ADD CONSTRAINT "zoo_species_counts_nonneg" CHECK (
  ("count_male" IS NULL OR "count_male" >= 0) AND
  ("count_female" IS NULL OR "count_female" >= 0) AND
  ("count_unsexed" IS NULL OR "count_unsexed" >= 0)
);

ALTER TABLE "research_project" ADD CONSTRAINT "research_years_order" CHECK (
  "ended_year" IS NULL OR "started_year" IS NULL OR "ended_year" >= "started_year"
);

ALTER TABLE "source" ADD CONSTRAINT "source_url_format" CHECK ("url" ~ '^https?://');

ALTER TABLE "knowledge_edge" ADD CONSTRAINT "edge_no_self_loop" CHECK (
  NOT ("src_type" = "dst_type" AND "src_id" = "dst_id")
);

-- ---------- индексы ----------

CREATE INDEX "zoo_published_idx" ON "zoo" ("publish_status") WHERE "publish_status" = 'published';
CREATE INDEX "zoo_species_published_idx" ON "zoo" ("city_id", "updated_at") WHERE "publish_status" = 'published';
CREATE INDEX "entity_source_verified_idx" ON "entity_source" ("entity_type", "entity_id", "status");
CREATE INDEX "knowledge_edge_predicate_idx" ON "knowledge_edge" ("predicate");

-- ---------- R1: география зоопарка ----------

CREATE OR REPLACE VIEW "v_zoo_geo" AS
SELECT z.id AS zoo_id, z.slug AS zoo_slug, z.name AS zoo_name,
       c.id AS city_id, c.name AS city_name, c.slug AS city_slug,
       r.id AS region_id, r.name AS region_name,
       co.id AS country_id, co.name AS country_name, co.slug AS country_slug, co.iso2
FROM "zoo" z
JOIN "city" c ON c.id = z.city_id
JOIN "country" co ON co.id = c.country_id
LEFT JOIN "region" r ON r.id = c.region_id;

-- ---------- R2: таксономическая линия ----------

CREATE OR REPLACE VIEW "v_taxon_lineage" AS
WITH RECURSIVE up AS (
  SELECT t.id AS start_id, t.id AS taxon_id, t.parent_id, t.scientific_name, t.rank_id, 0 AS depth
  FROM "taxon" t
  UNION ALL
  SELECT u.start_id, p.id, p.parent_id, p.scientific_name, p.rank_id, u.depth + 1
  FROM up u
  JOIN "taxon" p ON p.id = u.parent_id
)
SELECT start_id, taxon_id, parent_id, scientific_name, rank_id, depth
FROM up;

-- ---------- R3: участие в программе по виду (inferred) ----------

CREATE OR REPLACE VIEW "v_zoo_program_species" AS
SELECT zp.zoo_id, ps.taxon_id, ps.program_id,
       zp.role AS zoo_role, ps.role AS species_role,
       COALESCE(zp.since_year, cp.started_year) AS since_year
FROM "zoo_program" zp
JOIN "program_species" ps ON ps.program_id = zp.program_id
JOIN "conservation_program" cp ON cp.id = zp.program_id;

-- ---------- R4: виды под угрозой ----------

CREATE OR REPLACE VIEW "v_zoo_threatened" AS
SELECT zs.zoo_id, zs.taxon_id, iu.code AS iucn_code, iu.severity
FROM "zoo_species" zs
JOIN "species_profile" sp ON sp.taxon_id = zs.taxon_id
JOIN "iucn_status" iu ON iu.id = sp.iucn_status_id
WHERE iu.severity >= 3;

-- ---------- R5: похожие зоопарки (Jaccard по видам) ----------

CREATE OR REPLACE VIEW "v_related_zoos" AS
WITH sets AS (
  SELECT zoo_id, array_agg(taxon_id ORDER BY taxon_id) AS taxa
  FROM "zoo_species"
  GROUP BY zoo_id
),
pairs AS (
  SELECT a.zoo_id AS zoo_a, b.zoo_id AS zoo_b,
         cardinality(ARRAY(SELECT unnest(a.taxa) INTERSECT SELECT unnest(b.taxa))) AS inter,
         cardinality(a.taxa) + cardinality(b.taxa)
           - cardinality(ARRAY(SELECT unnest(a.taxa) INTERSECT SELECT unnest(b.taxa))) AS uni
  FROM sets a
  JOIN sets b ON a.zoo_id < b.zoo_id
)
SELECT zoo_a, zoo_b, inter::numeric / NULLIF(uni, 0) AS score
FROM pairs
WHERE inter > 0;

-- ---------- индекс поиска ----------

CREATE MATERIALIZED VIEW "mv_search_index" AS
SELECT 'zoo'::text AS entity_type, z.id AS entity_id, z.slug,
       z.name AS title,
       concat_ws(' · ', c.name, co.name) AS subtitle,
       concat_ws(' ', z.name, z.name_local, z.description) AS body,
       to_tsvector('russian', concat_ws(' ', z.name, z.name_local, coalesce(z.description, ''))) ||
       to_tsvector('english', concat_ws(' ', z.name, z.name_local, coalesce(z.description, ''))) AS tsv,
       z.updated_at
FROM "zoo" z
JOIN "city" c ON c.id = z.city_id
JOIN "country" co ON co.id = c.country_id
WHERE z.publish_status = 'published'
UNION ALL
SELECT 'species', t.id, t.slug, t.scientific_name,
       NULLIF(concat_ws(' · ', t.common_name_ru, t.common_name_en), ''),
       concat_ws(' ', t.scientific_name, t.common_name_ru, t.common_name_en, t.description,
                 sp.habitat_summary, sp.diet_summary),
       to_tsvector('russian', concat_ws(' ', coalesce(t.common_name_ru, ''), coalesce(t.description, ''), coalesce(sp.habitat_summary, ''))) ||
       to_tsvector('english', concat_ws(' ', t.scientific_name, coalesce(t.common_name_en, ''), coalesce(t.description, ''), coalesce(sp.habitat_summary, ''))),
       now()
FROM "taxon" t
LEFT JOIN "species_profile" sp ON sp.taxon_id = t.id
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
       concat_ws(' ', p.name, p.description, p.code::text),
       to_tsvector('russian', concat_ws(' ', p.name, coalesce(p.description, ''))) ||
       to_tsvector('english', concat_ws(' ', p.name, coalesce(p.description, ''), p.code::text)),
       now()
FROM "conservation_program" p
LEFT JOIN "organization" org ON org.id = p.organization_id
UNION ALL
SELECT 'organization', o.id, o.slug, o.name, o.acronym,
       concat_ws(' ', o.name, o.acronym, o.description),
       to_tsvector('russian', concat_ws(' ', o.name, coalesce(o.description, ''))) ||
       to_tsvector('english', concat_ws(' ', o.name, coalesce(o.acronym, ''), coalesce(o.description, ''))),
       now()
FROM "organization" o
UNION ALL
SELECT 'research', rp.id, rp.slug, rp.title, org.name,
       concat_ws(' ', rp.title, rp.summary),
       to_tsvector('russian', concat_ws(' ', rp.title, coalesce(rp.summary, ''))) ||
       to_tsvector('english', concat_ws(' ', rp.title, coalesce(rp.summary, ''))),
       now()
FROM "research_project" rp
LEFT JOIN "organization" org ON org.id = rp.lead_organization_id;

CREATE UNIQUE INDEX "mv_search_index_entity_idx" ON "mv_search_index" ("entity_type", "entity_id");
CREATE INDEX "mv_search_index_tsv_idx" ON "mv_search_index" USING GIN ("tsv");
CREATE INDEX "mv_search_index_title_trgm_idx" ON "mv_search_index" USING GIN ("title" gin_trgm_ops);
