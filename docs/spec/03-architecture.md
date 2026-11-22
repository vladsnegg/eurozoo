# ЧАСТЬ IV, VI, VIII. Архитектура, стек, модули

## IV.1. Контекстная диаграмма (C4, level 1)

```
[Гость/Редактор/Админ] ──HTTPS──> [Next.js web :3000]
                                      │  RSC + fetch /api/v1
                                      ▼
                                 [NestJS api :4000]
                                   │      │      │
                                   │      │      └──> [Файловое хранилище var/uploads или S3]
                                   ▼      ▼
                            [PostgreSQL 17]  [OSM tiles (MapLibre)]
                              + FTS/trgm
                            + knowledge_edge
```

Один узел развёртывания (docker compose): `web`, `api`, `db`, `db-test` (профиль test). Без очередей и брокеров.

## IV.2. Слои api

```
apps/api/src/
├─ main.ts                     bootstrap, helmet, cors, cookie-parser, versioning
├─ app.module.ts
├─ common/
│  ├─ filters/http-exception.filter.ts       RFC 7807
│  ├─ interceptors/logging.interceptor.ts
│  ├─ interceptors/cache.interceptor.ts      ETag + LRU
│  ├─ guards/session.guard.ts, roles.guard.ts
│  ├─ decorators/current-user.decorator.ts
│  ├─ pipes/zod-validation.pipe.ts
│  └─ utils/slug.ts, pagination.ts, errors.ts
├─ prisma/prisma.module.ts, prisma.service.ts
├─ modules/
│  ├─ auth/            (controller, service, session.repository)
│  ├─ zoos/            (controller, service, repository, dto, mapper)
│  ├─ species/         (taxon + species_profile)
│  ├─ taxonomy/        (tree, lineage, children)
│  ├─ geography/       (countries, regions, cities)
│  ├─ programs/
│  ├─ organizations/
│  ├─ research/
│  ├─ search/          (query parser, ranking, facets, synonyms)
│  ├─ graph/           (traversal, projection, whitelist)
│  ├─ related/         (similar, related, inference read-models)
│  ├─ sources/         (provenance, stale)
│  ├─ admin/           (CRUD controllers по ресурсам, publish, revisions, users)
│  └─ health/
└─ jobs/ refresh-search.ts, stale-report.ts, integrity-check.ts   (CLI, не scheduler)
```

Правила слоёв: controller → service → repository → Prisma. Controller не содержит бизнес-логики; service не знает о HTTP; repository не маппит в DTO. Публичный контракт — zod-схемы из `packages/shared`.

## IV.3. Слои web

```
apps/web/src/
├─ app/
│  ├─ layout.tsx, page.tsx, error.tsx, not-found.tsx, loading.tsx
│  ├─ zoos/page.tsx, zoos/[slug]/page.tsx
│  ├─ species/, taxonomy/, countries/, cities/, map/
│  ├─ programs/, organizations/, research/
│  ├─ search/page.tsx, graph/page.tsx
│  ├─ sources/, about/methodology/
│  ├─ login/
│  └─ admin/ (layout с guard, ресурсы, формы, публикация, пользователи)
├─ components/
│  ├─ layout/ (header, footer, breadcrumbs, nav)
│  ├─ ui/ (button, input, select, dialog, table, badge, skeleton, empty-state, toast)
│  ├─ knowledge/ (source-badge, iucn-badge, lineage-tree, entity-card, relation-list, similar-entities)
│  ├─ graph/ (graph-canvas, node-panel, filters, legend)
│  └─ forms/ (entity-form, relation-editor, source-picker)
├─ lib/ (api-client, query-keys, formatters, seo, auth)
└─ styles/ (tokens.css, globals.css)
```

Правила: Server Components — по умолчанию; `"use client"` только для интерактива (поиск, граф, формы, карта). Данные на сервере — через `api-client` с `next: { revalidate }`; мутации — server actions или вызов api из клиента с `credentials: 'include'`.

## IV.4. Потоки данных (ключевые)

**Карточка зоопарка:** RSC → `GET /zoos/:slug?include=...` → один запрос в api (Prisma `include` с ограничением полей) → HTML. Связанные блоки («связано с», «похожие») — отдельные запросы с `Promise.all` и `Suspense`.

**Поиск:** клиент (debounce) → `GET /search` → SQL: `websearch_to_tsquery('russian', expanded)` + `ts_rank_cd` + `similarity(title)` → фасеты отдельным CTE → ответ. Синонимы и типы — из кэша LRU (TTL 60 с).

**Граф:** `GET /graph?seed=zoo:1&depth=2` → рекурсивный CTE BFS по `knowledge_edge` + структурным рёбрам, проекция в `{nodes, edges}` → React Flow + ELK layout на клиенте.

**Админ-мутация:** форма → zod (client) → `POST/PATCH /admin/...` → zod (server) → service (проверка инвариантов, ревизия, публикация) → Prisma transaction → `refresh-search` (deferred, debounce 2 с) → UI toast + revalidate path.

## IV.5. Модель отказов

| Отказ | Поведение |
|---|---|
| API недоступен | web показывает error boundary с кнопкой «Повторить», не белый экран |
| Postgres недоступен | `/health` 503, web — понятная страница, логи без секретов |
| Тайлы карты недоступны | карта заменяется списком, ошибка не блокирует страницу |
| Конфликт версий (409) | форма показывает diff-сообщение и предлагает перезагрузить |
| Ошибка валидации (422) | inline-ошибки по полям, введённые данные сохраняются |
| Rate limit (429) | сообщение с временем повтора, без потери формы |

## VI. Технологический стек и обоснование

| Слой | Выбор | Версия | Почему | Альтернативы и почему нет |
|---|---|---|---|---|
| UI | Next.js (App Router) + React + TypeScript | 15.x / 19.x / 5.x | SSR/SEO, RSC снижает клиентский JS, файловая маршрутизация, совместимо с прежним стеком | Vite+React SPA — хуже SEO и первичная загрузка; Nuxt — команда/стек на TS+React |
| Стили | Tailwind CSS + CSS-токены + shadcn/ui | 4.x | Единый дизайн, доступные примитивы, нет «дизайн-системы с нуля» | MUI — тяжёлый, свой look; Bootstrap — устаревшая эстетика |
| Данные (клиент) | TanStack Query | 5.x | Кэш, отмена запросов, состояния загрузки/ошибки | SWR — меньше возможностей для мутаций |
| Граф | React Flow + ELK | 12.x / 0.9 | Готовый canvas, кастомные узлы, layout | D3 — много ручной работы; Cytoscape — тяжелее интеграция с React |
| Карта | MapLibre GL JS | 5.x | OSM без API-ключа, кластеры, вектор | Google Maps — ключ/биллинг; Leaflet — слабее кластеризация |
| API | NestJS | 11.x | Модули, DI, guards/pipes, тестируемость, совместим с прежним стеком | Express «руками» — нет структуры; Fastify standalone — меньше готовых паттернов |
| ORM | Prisma | 6.x | Типобезопасность, миграции, introspect, `include` | TypeORM — слабее типы; Drizzle — меньше экосистема миграций |
| БД | PostgreSQL | 17 | FK, CHECK, FTS, trigram, рекурсивные CTE, JSONB | MySQL — слабее FTS/CTE; SQLite — нет конкурентности и FTS-ранжирования в нужном объёме |
| Поиск | Postgres FTS + pg_trgm + unaccent + синонимы | — | Один движок, объяснимость, нулевая инфраструктура | Elasticsearch — лишний сервис; pgvector — нет корпуса/метрик |
| Auth | Серверные сессии + Argon2id | — | Отзыв сессий, httpOnly cookie, простота | JWT в localStorage — XSS-риск; Auth0 — внешняя зависимость |
| Валидация | zod + shared-схемы | 4.x | Один контракт на клиенте и сервере | class-validator — дублирование DTO |
| Тесты | Vitest, Supertest, Playwright, axe-core | актуальные | Скорость, реальные HTTP/E2E, доступность | Jest — медленнее; Cypress — тяжелее в CI |
| Монорепо | pnpm + Turborepo | 9–10 / 2.x | Единые типы, кэш сборки, workspace-протокол | npm workspaces — медленнее; Nx — избыточен |
| Контейнеры | Docker Compose | — | Воспроизводимость, одна команда запуска | Kubernetes — избыточен |
| CI | GitHub Actions | — | Бесплатно для учебного репо, сервис Postgres | GitLab CI — другой хостинг |

**Версии фиксируются** в `package.json` (без `^` для критичных: next, react, prisma, nestjs) и в `docker-compose.yml` (образы с точным тегом, например `postgres:17.2-alpine`). Обновление — отдельным PR с прогоном тестов.

## VI.1. Развёртывание

- **Dev:** `docker compose up -d db` + `pnpm dev` (web+api). Миграции: `pnpm db:migrate`; сид: `pnpm db:seed`.
- **Demo/прод-подобный:** `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build` — три контейнера, healthcheck, `db` не публикует порт наружу.
- **CI:** сервис `postgres:17` в job, `pnpm install --frozen-lockfile`, `prisma migrate deploy`, тесты.
- **Резервные копии:** `pg_dump` перед демо; инструкция в README.

## VIII. Взаимодействие модулей и границы ответственности

| Модуль | Владеет | Потребляет | Публичный контракт |
|---|---|---|---|
| geography | country, region, city | — | чтение агрегатов |
| zoos | zoo, zoo_event, zoo_facility, enclosure | geography, sources | `ZooDto` |
| species/taxonomy | taxon, species_profile, habitat | sources | `SpeciesDto`, `TaxonNode` |
| programs | conservation_program, program_species, zoo_program | zoos, species, organizations | `ProgramDto` |
| organizations | organization, zoo_organization | geography | `OrganizationDto` |
| research | research_project, zoo_research, research_species | zoos, species | `ResearchDto` |
| sources | source, entity_source | все (через сервис) | `SourceDto`, `Provenance` |
| search | search_index (matview), search_synonym | все (только чтение) | `SearchResponse` |
| graph | knowledge_edge, predicate | все (проекция) | `GraphResponse` |
| admin | ревизии, публикация, пользователи | все сервисы | admin DTO |

**Правила:** модуль не читает таблицы другого модуля напрямую (кроме search/graph — им разрешено read-only представление). Кросс-модульные операции — через сервисные интерфейсы. Общие типы — только в `packages/shared`; циклические импорты запрещены (проверка `madge` в CI).

## VIII.1. Соглашения по расширению

- Новый тип сущности в графе: добавить значение в enum `entity_type` + реализовать `EntityResolver` (label, url, summary) + тест проекции.
- Новый предикат: строка в `predicate` с domain/range + whitelist в graph-модуле + тест валидации.
- Новый ранг таксона: строка в `taxonomic_rank` (без миграции), уровень задаёт порядок в дереве.
- Новый источник: тип в enum `source_type`; правила URL — в `sources.service`.
