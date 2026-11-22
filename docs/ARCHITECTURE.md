# Архитектура (операционный документ)

Источник требований: `docs/spec/03-architecture.md`. Здесь — решения, которые обязательны к исполнению в коде.

## 1. Компоненты

```
apps/web  (Next.js 15, RSC)  :3000  ──HTTP──>  apps/api (NestJS 11) :4000 ──Prisma──> PostgreSQL 17 :5433
packages/shared (zod + types)                                   └─ raw SQL: FTS, views, graph CTE
```

- Один экземпляр каждого сервиса. Без Redis, очередей, внешнего поиска.
- Postgres — единственный источник истины; никаких копий данных в web.
- API — единственный владелец бизнес-правил; web не ходит в БД.

## 2. Слои API

`controller → service → repository → Prisma`. Контроллер не содержит логики; сервис не знает HTTP; репозиторий возвращает доменные объекты.

**DI-правило:** в конструкторах всегда указывать `@Inject(Token)` явно. Vitest/esbuild не эмитит `design:paramtypes`, и неявная инъекция даёт `undefined`.

```
apps/api/src/
  main.ts, app.module.ts
  common/ (filters, interceptors, guards, decorators, pipes, utils)
  prisma/
  modules/{health,auth,zoos,species,taxonomy,geography,programs,organizations,research,search,graph,related,sources,admin,stats}
  jobs/ (CLI: refresh-search, stale-report, integrity-check)
```

## 3. Слои Web

Server Components по умолчанию; `"use client"` — поиск, граф, формы, карта. Данные — `lib/api-client.ts` (типизированный fetch), кэш — `next: { revalidate }`. Мутации — через API с cookie.

## 4. Потоки

| Сценарий | Путь |
|---|---|
| Карточка зоопарка | RSC → `GET /zoos/:slug` → Prisma include (select-поля) → HTML; связанные блоки — параллельные запросы |
| Поиск | client (debounce 300 мс, AbortController) → `GET /search` → FTS+trgm+синонимы → фасеты |
| Граф | `GET /graph` → recursive CTE → `{nodes, edges}` → React Flow + ELK |
| Мутация | форма → zod → API → service (инварианты, ревизия) → Prisma tx → refresh search (debounce) → revalidate |

## 5. Контракты и совместимость

- Zod-схемы в `packages/shared` — единственный источник DTO.
- Изменение публичного контракта — только с пометкой `shared-change` в PR.
- `include`/`sort` — строгие whitelist'ы; неизвестный параметр → 400.
- Ошибки — RFC 7807 (`type`, `title`, `status`, `detail`, `errors[]`).

## 6. Отказоустойчивость

API недоступен → error boundary; БД недоступна → `/health` 503 + понятная страница; тайлы карты недоступны → список зоопарков; 409 → сообщение о конфликте и перезагрузка; 429 → `Retry-After`.

## 7. Конфигурация

Обязательные env валидируются zod при старте API: `DATABASE_URL`, `API_PORT`, `WEB_ORIGIN`, `SESSION_SECRET`. Web: `NEXT_PUBLIC_API_URL`. Значения — только через `.env`, пример — `.env.example`.

## 8. Развёртывание

- dev: `docker compose up -d db` + `pnpm dev`.
- demo: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`.
- миграции: `prisma migrate deploy`; сид — отдельной командой.

## 9. Ограничения производительности

Списки ≤ 100; граф ≤ 200 узлов / 400 рёбер / глубина 3; расширение поиска ≤ 8 термов; карточка ≤ 6 запросов.
