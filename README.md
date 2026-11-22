# EuroZoo Atlas

База знаний о европейских зоопарках: зоопарки, виды, таксономия, программы сохранения, организации, исследования и связи между ними с обязательным указанием источников.

## Требования

- Node.js ≥ 20 (проверено на 22)
- pnpm ≥ 9 (используется 11)
- Docker (для PostgreSQL)

## Быстрый старт

```bash
git clone https://github.com/vladsnegg/eurozoo.git
cd eurozoo
cp .env.example .env
pnpm install
docker compose up -d db
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm search:refresh
pnpm build            # собирает packages/shared и приложения
pnpm dev              # web :3000, api :4000
```

Проверка: <http://localhost:4000/api/v1/health> → `{"status":"ok","database":"up",...}`.

> Порт PostgreSQL — `5433`, чтобы не конфликтовать с локальной установкой на 5432.
> Тестовая БД — `docker compose --profile test up -d db-test` (порт `5434`).

## Скрипты

| Команда | Назначение |
|---|---|
| `pnpm dev` | web + api в watch-режиме |
| `pnpm build` | сборка всех пакетов |
| `pnpm lint` | ESLint (flat config) |
| `pnpm typecheck` | проверка типов всех пакетов |
| `pnpm test` | unit/API-тесты |
| `pnpm db:generate` | генерация Prisma Client |
| `pnpm db:migrate` | применение миграций |
| `pnpm db:seed` | загрузка реальных данных (идемпотентно) |
| `pnpm db:reset` | сброс БД и миграции заново |
| `pnpm data:verify` | проверка сид-файлов: allowlist доменов, sourceRefs, дубли, покрытие |
| `pnpm data:verify:online` | то же + проверка доступности всех URL источников |
| `pnpm data:check` | проверка целостности данных в БД и минимального покрытия |
| `pnpm data:stale` | отчёт о просроченном провенансе |
| `pnpm format` | Prettier |

## Структура

```
apps/web      Next.js 15 (App Router), Tailwind 4
apps/api      NestJS 11, Prisma 6, PostgreSQL 17
packages/shared  zod-контракты и общие типы
docs/         аудит, ТЗ, спецификация, промпты, ADR
```

## Документация

- `docs/spec/` — полная проектная спецификация.
- `docs/ARCHITECTURE.md`, `docs/DOMAIN.md`, `docs/API.md`, `docs/INFERENCE.md`.
- `docs/adr/` — принятые архитектурные решения.
- `docs/prompts/` — процесс и промпты этапов.

## Устранение неполадок

| Проблема | Решение |
|---|---|
| `port is already allocated` (5433) | занят другой контейнер/сервис: `docker ps`, освободите порт или измените маппинг |
| `Invalid environment configuration` | скопируйте `.env.example` → `.env`, проверьте `SESSION_SECRET` (≥ 32 символов) |
| API не видит БД | `docker compose up -d db`, проверьте `DATABASE_URL` (порт 5433) |
| `@eurozoo/shared` не найден | `pnpm build` (собирает shared первым) |
| Порты 3000/4000 заняты | запустите API с `API_PORT=4100`, web — `pnpm --filter @eurozoo/web exec next dev -p 3100`; при сборке задайте `NEXT_PUBLIC_API_URL=http://localhost:4100/api/v1` |
| `EADDRINUSE` в логах api | порт занят другим процессом: `Get-NetTCPConnection -LocalPort 4000` |
