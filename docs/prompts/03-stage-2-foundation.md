# ПРОМПТ ЭТАПА 2 — Фундамент приложения и инфраструктура

## 1. РОЛЬ
Ты — platform engineer. Ты создаёшь каркас, на котором остальные этапы будут работать без боли: запуск, конфиг, CI, базовые страницы, обработка ошибок.

## 2. КОНТЕКСТ
EuroZoo Atlas. Стек: pnpm + Turborepo, `apps/web` (Next.js 15 App Router), `apps/api` (NestJS 11), `packages/shared`, PostgreSQL 17 в Docker на `5433`.

## 3. ТЕКУЩАЯ АРХИТЕКТУРА
Результат этапа 1: утверждённые `docs/ARCHITECTURE.md`, `docs/DOMAIN.md`, `docs/API.md`, `schema.prisma` (черновик), zod-схемы.

## 4. РЕЗУЛЬТАТЫ ПРЕДЫДУЩИХ ЭТАПОВ
Аудит (этап 0) и архитектура (этап 1). Если код уже существует — адаптировать, а не перезаписывать: сохранить рабочие части, добавить недостающее.

## 5. ЦЕЛЬ
`git clone` → 3 команды → работающее приложение с health-check, единым layout, обработкой ошибок и зелёным CI.

## 6. ТЕХНИЧЕСКОЕ ЗАДАНИЕ
1. Workspace: `pnpm-workspace.yaml`, `turbo.json`, корневой `package.json` со скриптами: `dev`, `build`, `lint`, `typecheck`, `test`, `test:api`, `test:e2e`, `db:migrate`, `db:seed`, `db:reset`, `data:check`, `data:stale`, `search:refresh`.
2. `apps/api`: NestJS bootstrap, `ConfigModule` с zod-валидацией env (падать при отсутствии обязательных), `helmet`, CORS только для `WEB_ORIGIN`, `cookie-parser`, глобальный exception filter (RFC 7807), logging interceptor с `requestId`, `ValidationPipe` (zod), версия `v1`, `/health` (db ping + версия).
3. `apps/web`: layout с header/footer, страницы `/`, `/not-found`, `error.tsx`, `loading.tsx`; дизайн-токены из `05-ui-ux.md`; базовые UI-компоненты (`Button`, `Input`, `Card`, `Badge`, `EmptyState`, `Skeleton`, `ErrorState`).
4. Docker: `docker-compose.yml` — `db` (postgres:17-alpine, порт 5433, volume, healthcheck), профиль `test` с `db-test`; `.env.example`; `docker compose up -d db` достаточно для разработки.
5. CI (GitHub Actions): job `ci` — install (frozen lockfile), prisma generate/validate, lint, typecheck, unit, api-тесты с сервисом Postgres, build; кэш pnpm.
6. `packages/shared`: базовые enum'ы и zod-примитивы (без бизнес-схем, если этап 1 их не утвердил).
7. README: требования, установка, запуск, тесты, troubleshooting (порт занят, Docker не запущен).

## 7. ЗАДАЧИ
1. Создать/адаптировать workspace и скрипты.
2. Поднять api с health и конфигом.
3. Поднять web с layout и токенами.
4. Настроить compose и CI.
5. Настроить линт/формат/тайпчек (eslint flat config, prettier, tsconfig base).
6. Добавить `.gitignore` (node_modules, .env, .next, dist, coverage).
7. Проверить на чистом клоне.

## 8. ТЕХНОЛОГИЧЕСКИЕ ОГРАНИЧЕНИЯ
- Никакой бизнес-логики, кроме health/config.
- Никаких БД-миграций (только подключение и ping).
- Не добавлять state-менеджеры, UI-киты сверх утверждённых.
- Node ≥ 20 LTS; pnpm ≥ 9; фиксированные версии критичных пакетов.

## 9. КАЧЕСТВО
- Нет `any`; env типизирован.
- Ошибки конфигурации — человекочитаемые, с указанием переменной.
- Компоненты доступны по умолчанию (label, focus, aria).
- Скрипты идемпотентны.

## 10. БЕЗОПАСНОСТЬ
- Helmet, CORS whitelist, `trust proxy` осознанно.
- Cookie: `httpOnly`, `sameSite=lax`, `secure` в prod.
- `.env` не в git; secret scan в CI.
- Никаких `NODE_TLS_REJECT_UNAUTHORIZED=0`.

## 11. GITHUB
Ветка `stage/2-foundation`; PR с чек-листом; CI должен быть зелёным; не мержить самостоятельно.

## 12. PRE-FLIGHT
Проверить: этап 1 принят; версии Node/pnpm/Docker; свободен ли порт 5433; нет ли конфликтующих `.env`.

## 13. СОВМЕСТИМОСТЬ
Если в репозитории была рабочая сборка — не ломать: сравнить скрипты, сохранить существующие алиасы, зафиксировать изменения в PR.

## 14. ТЕСТЫ
- Unit: валидатор env (обязательные/опциональные), утилиты.
- API: `GET /health` → 200 и структура; неизвестный маршрут → 404 RFC 7807.
- E2E smoke: главная открывается, header/footer на месте, 404-страница.
- Всё зелёное в CI.

## 15. КРИТЕРИИ ПРИЁМКИ
- [ ] `pnpm install && pnpm dev` работает на чистой машине.
- [ ] `docker compose up -d db` + `pnpm db:*` не падают.
- [ ] `/health` 200; `/api/v1/unknown` 404 в формате RFC 7807.
- [ ] Главная, 404, error boundary работают.
- [ ] CI зелёный; секретов нет.
- [ ] README позволяет запустить без вопросов.
- [ ] Отчёт по шаблону.

## 16. ОТЧЁТ
По шаблону + вывод `pnpm build`, `docker compose ps`, скриншот главной и 404.

## 17. ЗАПРЕЩЕНО
- Реализовывать каталоги/поиск/граф.
- Игнорировать ошибки CI.
- Хардкодить секреты/URL окружения.
- Оставлять «временный» конфиг без задачи на удаление.
