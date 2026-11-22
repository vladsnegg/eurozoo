# ЧАСТЬ V. Модель знаний, ER и связи

## V.1. Логическая модель (онтология)

Система реализует **облегчённую онтологию предметной области** в терминах классов, объектных свойств и ограничений. Онтология хранится в двух местах:

1. **Схема БД** — классы (таблицы), атрибуты (колонки), жёсткие связи (FK) и кардинальности.
2. **Реестр предикатов** `predicate` — машиночитаемое описание сквозных отношений: код, домен, диапазон, кардинальность, транзитивность, выводимость.

OWL/SPARQL не внедряются: у них нет потребителя в UI/API, а поддержка десериализации и ризонера несопоставима с пользой для курсовой (ADR-03). Экспорт в Turtle — опция P2.

### Классы (сущности)

| Класс | Таблица | Определение | Идентификатор |
|---|---|---|---|
| Country | `country` | государство Европы | `id` (uuid), `iso2` (uniq) |
| Region | `region` | административный регион страны | `id`, `(country_id, slug)` uniq |
| City | `city` | населённый пункт | `id`, `(country_id, slug)` uniq |
| Zoo | `zoo` | зоопарк | `id`, `slug` uniq |
| ZooEvent | `zoo_event` | событие истории зоопарка | `id` |
| Enclosure | `enclosure` | вольер/зона содержания | `id` |
| Facility | `facility` | объект инфраструктуры посетителя | `id`, `slug` uniq |
| TaxonomyRank | `taxonomic_rank` | ранг (kingdom…species) | `id`, `level` uniq |
| Taxon | `taxon` | таксон любого ранга | `id`, `scientific_name` uniq |
| SpeciesProfile | `species_profile` | вид-специфичные знания (1:1) | `taxon_id` (PK/FK) |
| IucnStatus | `iucn_status` | категория IUCN | `id`, `code` uniq |
| Habitat | `habitat` | биом/среда обитания | `id`, `slug` uniq |
| ConservationProgram | `conservation_program` | программа сохранения/разведения | `id`, `slug` uniq |
| Organization | `organization` | EAZA, WAZA, нац. ассоциации и т.п. | `id`, `slug` uniq |
| ResearchProject | `research_project` | научный проект | `id`, `slug` uniq |
| EducationProgram | `education_program` | образовательная программа зоопарка | `id` |
| Source | `source` | первоисточник | `id` |
| KnowledgeEdge | `knowledge_edge` | сквозное типизированное ребро | `id` |
| Predicate | `predicate` | реестр предикатов | `id`, `code` uniq |
| AppUser | `app_user` | пользователь системы | `id`, `email` uniq |
| Session | `session` | серверная сессия | `id` |

### Объектные свойства (реестр предикатов, обязательный минимум)

| code | Домен → Диапазон | Кардинальность | Транзитивно | Inferred | Смысл |
|---|---|---|---|---|---|
| `LOCATED_IN` | Zoo → City | N:1 | нет | нет | структурная FK `zoo.city_id` |
| `CITY_IN_COUNTRY` | City → Country | N:1 | нет | нет | FK `city.country_id` |
| `CITY_IN_REGION` | City → Region | N:1 | нет | нет | FK `city.region_id` (nullable) |
| `PART_OF` | Taxon → Taxon | N:1 | **да** | нет | FK `taxon.parent_id`; транзитивность для линии |
| `RANK_OF` | Taxon → TaxonomicRank | N:1 | нет | нет | FK `taxon.rank_id` |
| `HAS_PROFILE` | Taxon(species) → SpeciesProfile | 1:1 | нет | нет | FK `species_profile.taxon_id` |
| `HAS_STATUS` | SpeciesProfile → IucnStatus | N:1 | нет | нет | FK `species_profile.iucn_status_id` |
| `INHABITS` | Taxon → Habitat | N:M | нет | нет | `species_habitat` |
| `KEEPS` | Zoo → Taxon | N:M | нет | нет | `zoo_species` (кол-во, годы, разведение) |
| `PARTICIPATES_IN` | Zoo → ConservationProgram | N:M | нет | нет | `zoo_program` (роль, годы) |
| `TARGETS` | ConservationProgram → Taxon | N:M | нет | нет | `program_species` |
| `MEMBER_OF` | Zoo → Organization | N:M | нет | нет | `zoo_organization` |
| `OPERATES` | Organization → ConservationProgram | 1:N | нет | нет | FK `conservation_program.organization_id` |
| `CONDUCTS` | Zoo → ResearchProject | N:M | нет | нет | `zoo_research` |
| `STUDIES` | ResearchProject → Taxon | N:M | нет | нет | `research_species` |
| `OFFERS` | Zoo → EducationProgram | 1:N | нет | нет | FK `education_program.zoo_id` |
| `HAS_FACILITY` | Zoo → Facility | N:M | нет | нет | `zoo_facility` |
| `HAS_EVENT` | Zoo → ZooEvent | 1:N | нет | нет | FK `zoo_event.zoo_id` |
| `PROVEN_BY` | * → Source | N:M | нет | нет | `entity_source` |
| `RELATED_TO` | * → * | N:M | нет | нет | `knowledge_edge` с `predicate='RELATED_TO'` |
| `SUCCEEDED_BY` | ConservationProgram → ConservationProgram | N:1 | да | нет | ребро; преемственность программ |
| `INFERRED_PROGRAM_SPECIES` | Zoo → Taxon | N:M | нет | **да** | вычисляется правилом R3, не хранится |
| `SIMILAR_TO` | Zoo → Zoo / Taxon → Taxon | N:M | нет | **да** | вычисляется R5, не хранится |

**Правило валидации ребра:** `predicate.domain_type` = `src_type` И `predicate.range_type` = `dst_type`; `src_id`/`dst_id` существуют; нет self-loop; уникальность `(src_type, src_id, predicate, dst_type, dst_id)`.

## V.2. Физическая схема (ключевые таблицы)

Типы: `uuid` (PK, `gen_random_uuid()`), `text`, `int`, `numeric(8,2)`, `date`, `timestamptz`, `boolean`, enum (Postgres enum для закрытых списков).

```sql
-- География
country(id uuid pk, iso2 char(2) uniq, iso3 char(3) uniq, name text, name_local text,
        slug text uniq, eu_member bool default false, created_at, updated_at)
region(id uuid pk, country_id uuid fk country on delete restrict, name text, slug text,
        unique(country_id, slug))
city(id uuid pk, country_id uuid fk restrict, region_id uuid null fk set null, name text,
        slug text, lat numeric(9,6), lng numeric(9,6), population int,
        unique(country_id, slug), check(lat between 34 and 72), check(lng between -25 and 45))

-- Зоопарк
zoo(id uuid pk, slug text uniq, name text, name_local text, city_id uuid fk restrict,
    founded_year int check(founded_year between 1200 and 2100),
    area_ha numeric(8,2) check(area_ha > 0),
    annual_visitors int check(annual_visitors >= 0),
    website text check(website ~ '^https?://'),
    lat numeric(9,6), lng numeric(9,6), description text,
    status zoo_status not null default 'active',
    publish_status publish_status not null default 'draft',
    created_at, updated_at)

zoo_event(id uuid pk, zoo_id uuid fk cascade, year int check(1200..2100), exact_date date null,
          type event_type, title text, description text)

enclosure(id uuid pk, zoo_id uuid fk cascade, name text, type enclosure_type,
          area_m2 numeric(10,2) check(area_m2 > 0), habitat_id uuid null fk set null)

-- Таксономия
taxonomic_rank(id smallint pk, code text uniq, name_ru text, level smallint uniq check(level >= 0))
taxon(id uuid pk, rank_id smallint fk, parent_id uuid null fk restrict, scientific_name text uniq,
      common_name_ru text, common_name_en text, authority text, year_described int,
      gbif_key bigint, description text, search_vector tsvector,
      check(parent_id <> id))
species_profile(taxon_id uuid pk fk cascade, iucn_status_id smallint null fk,
      population_trend trend_enum null, habitat_summary text, diet_summary text,
      lifespan_years numeric(4,1), weight_kg_min numeric(8,2), weight_kg_max numeric(8,2),
      length_cm_min numeric(8,2), length_cm_max numeric(8,2),
      check(weight_kg_min is null or weight_kg_max is null or weight_kg_min <= weight_kg_max))
iucn_status(id smallint pk, code text uniq, name_ru text, severity smallint uniq, color text)
habitat(id uuid pk, slug text uniq, name text, biome biome_enum, description text)
species_habitat(taxon_id fk cascade, habitat_id fk cascade, primary key(taxon_id, habitat_id))

-- Программы и организации
conservation_program(id uuid pk, slug text uniq, code program_code, name text,
      organization_id uuid null fk set null, started_year int, ended_year int,
      status program_status default 'active',
      check(ended_year is null or started_year is null or ended_year >= started_year))
program_species(program_id fk cascade, taxon_id fk cascade, role program_role,
      primary key(program_id, taxon_id))
zoo_program(zoo_id fk cascade, program_id fk cascade, role participation_role,
      since_year int, until_year int, primary key(zoo_id, program_id))
organization(id uuid pk, slug text uniq, name text, acronym text unique null,
      type org_type, country_id uuid null fk set null, founded_year int, website text)

-- Содержание животных
zoo_species(zoo_id fk cascade, taxon_id fk cascade, count_male int, count_female int,
      count_unsexed int, since_year int, breeding bool default false,
      enclosure_id uuid null fk set null, note text,
      primary key(zoo_id, taxon_id), check(count_male >= 0 and ...))

-- Исследования, образование, инфраструктура
research_project(id uuid pk, slug text uniq, title text, summary text, started_year int,
      ended_year int, status research_status, lead_organization_id uuid null fk set null)
zoo_research(zoo_id fk cascade, research_project_id fk cascade, primary key(...))
research_species(research_project_id fk cascade, taxon_id fk cascade, primary key(...))
education_program(id uuid pk, zoo_id fk cascade, title text, audience audience_enum,
      format education_format, description text, url text)
facility(id uuid pk, slug text uniq, name text, category facility_category)
zoo_facility(zoo_id fk cascade, facility_id fk cascade, note text, primary key(...))

-- Провенанс
source(id uuid pk, type source_type, title text, url text check(url ~ '^https?://'),
      publisher text, published_at date, accessed_at date not null, license text,
      reliability reliability_enum not null, created_at)
entity_source(id uuid pk, entity_type entity_type, entity_id uuid, source_id uuid fk restrict,
      field_name text null, confidence numeric(3,2) check(confidence between 0 and 1),
      retrieved_at date, verified_at date null, status provenance_status default 'current',
      unique(entity_type, entity_id, source_id, field_name))

-- Граф
predicate(id uuid pk, code text uniq, label_ru text, domain_type entity_type,
      range_type entity_type, cardinality text check(cardinality in ('N:1','1:N','N:M','1:1')),
      is_transitive bool default false, is_inferred bool default false, description text)
knowledge_edge(id uuid pk, src_type entity_type, src_id uuid, predicate text fk predicate(code),
      dst_type entity_type, dst_id uuid, confidence numeric(3,2), source_id uuid null fk set null,
      note text, created_at,
      unique(src_type, src_id, predicate, dst_type, dst_id),
      check(not (src_type = dst_type and src_id = dst_id)))

-- Пользователи
app_user(id uuid pk, email citext uniq, password_hash text, display_name text,
      role user_role default 'viewer', is_active bool default true, created_at, last_login_at)
session(id uuid pk, user_id fk cascade, token_hash text uniq, expires_at timestamptz,
      created_at, user_agent text, ip inet)
knowledge_revision(id bigserial pk, entity_type entity_type, entity_id uuid, action text,
      diff jsonb, actor_id uuid null fk set null, created_at)
```

**Поиск:**
```sql
create materialized view mv_search_index as
select 'zoo' entity_type, z.id entity_id, z.slug, z.name title,
       concat_ws(' · ', ci.name, co.name) subtitle,
       concat_ws(' ', z.name, z.name_local, z.description) body,
       to_tsvector('russian', concat_ws(' ', z.name, z.description)) ||
       to_tsvector('english', concat_ws(' ', z.name_local, z.description)) tsv,
       z.updated_at
from zoo z join city ci on ... join country co on ...
union all
select 'species', t.id, t.slug, t.scientific_name, concat_ws(' · ', t.common_name_ru, t.common_name_en),
       concat_ws(' ', t.common_name_ru, t.common_name_en, t.description, sp.habitat_summary), ...
from taxon t left join species_profile sp on sp.taxon_id = t.id
where t.rank_id = (select id from taxonomic_rank where code='species')
union all ... -- country, city, program, organization, research
;
create unique index on mv_search_index(entity_type, entity_id);
create index on mv_search_index using gin(tsv);
create index on mv_search_index using gin(title gin_trgm_ops);
```
Обновление: `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_search_index` после мутаций (debounce 2 с в процессе API, вне транзакции мутации), плюс CLI `pnpm search:refresh`.

**Синонимы и расширение запроса:**
```sql
search_synonym(id, term text, synonym text, language char(2), weight numeric(3,2) default 1.0,
               unique(term, synonym))
```
Алгоритм: нормализация (lower, unaccent) → поиск термов в синонимах → расширение до 8 термов → `websearch_to_tsquery` + `OR` → ранжирование.

## V.3. Диаграммы

- ER: `docs/diagrams/er.mmd` (Mermaid `erDiagram`).
- Логические связи и правила вывода: `docs/diagrams/knowledge-graph.mmd`.

## V.4. Правила вывода (inference)

Правила реализуются **SQL-представлениями** (не хранятся как факты), доступны только для чтения, помечаются `inferred=true` в API.

| ID | Правило | Реализация | Пример | Тест |
|---|---|---|---|---|
| R1 | Транзитивная география: `zoo → city → region? → country` | `v_zoo_geo` (join) | зоопарк в Праге → Чехия → регион «Прага» | 3 зоопарка в разных странах |
| R2 | Таксономическая линия до корня | `v_taxon_lineage` (recursive CTE) | вид → род → семейство → отряд → класс → тип → царство | глубина = числу предков |
| R3 | Если зоопарк участвует в программе, а программа нацелена на вид → зоопарк «участвует в программе по виду» | `v_zoo_program_species` (join, `inferred`) | Zoo A + EEP X + вид V → строка с `inferred=true` | не дублирует явное `KEEPS` |
| R4 | Агрегация «виды под угрозой»: виды с IUCN severity ≥ 3, содержащиеся в зоопарке | `v_zoo_threatened` (join + filter) | в зоопарке 4 вида CR/EN | счётчик совпадает с ручным |
| R5 | Похожие зоопарки: Jaccard по множествам видов и программ ≥ 0.2 | SQL: пересечение/объединение, порог; сортировка | зоопарки с общей коллекцией | симметричность (A~B ⇒ B~A) |
| R6 | «Связано с»: рёбра сущности, сгруппированные по предикату, лимит 8, приоритет — редкие предикаты | `knowledge_edge` + структурные связи | карточка зоопарка показывает партнёрские организации | нет дублей, направление учтено |

**Почему не больше:** правила, требующие внешних знаний (например, «климатическая зона по координатам»), не проверяемы без геоданных; правила, дублирующие агрегаты, не дают ценности. Каждое правило R1–R6 покрыто SQL-тестом на фикстурах.

## V.5. Обработка отсутствующих данных

- `NULL` = «неизвестно», UI: «нет данных» + «предложить источник» (форма обратной связи/тикет).
- Отсутствие IUCN у вида — не блокирует страницу, бейдж «статус не указан».
- Отсутствие координат — зоопарк исключается из карты, но остаётся в каталоге (фильтр «без координат»).
- Отсутствие региона — цепочка `zoo → city → country` работает.
- Частичные даты — `year` без `date`, UI «≈ 1900».

## V.6. Версионирование знаний

- **Ревизии:** `knowledge_revision` — append-only журнал (кто, действие, diff JSONB, время). Полное темпоральное версионирование не вводится: для курсовой достаточно аудита и возможности откатить вручную по diff.
- **Публикация:** `draft → review → published`; `published` требует источника и `verified_at` для «ключевых» полей (`zoo.founded_year`, `species_profile.iucn_status_id`, `zoo_species.*`).
- **Источники:** удаление источника запрещено при наличии ссылок (409); изменение — только с записью ревизии.

## V.7. Расширяемость

- Новый класс: таблица + `entity_type` enum + resolver + сид + тесты проекции.
- Новый предикат: строка в `predicate` + whitelist графа + тест domain/range.
- Новый ранг таксона: строка в `taxonomic_rank` (level) — без миграции.
- Новый тип источника: значение enum + тест валидации URL.
- Смена классификации: перепривязка `taxon.parent_id` не требует изменения схемы (в отличие от отдельных таблиц family/order).
