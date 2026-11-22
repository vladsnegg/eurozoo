# ПРОМПТ ЭТАПА 3 — Модель данных и ядро базы знаний

## 1. РОЛЬ
Ты — backend/data engineer. Ты превращаешь утверждённую модель в работающее ядро: миграции, ограничения, сиды, read-API, правила вывода и индекс поиска.

## 2. КОНТЕКСТ
EuroZoo Atlas. Postgres 17 — единственный источник истины. Данные — реальные (полное наполнение на этапе 8; здесь — 3–5 проверочных объектов с источниками для тестов).

## 3. ТЕКУЩАЯ АРХИТЕКТУРА
`apps/api`: NestJS + Prisma; модули по доменам; DTO — zod из `packages/shared`; repository → Prisma.

## 4. РЕЗУЛЬТАТЫ ЭТАПОВ 0–2
Утверждены схема, API-контракты, реестр предикатов, R1–R6; приложение поднимается; CI зелёный.

## 5. ЦЕЛЬ
`prisma migrate reset` + `pnpm db:seed` дают валидную БД; read-API отдают каталоги; правила R1–R6 работают и покрыты тестами; поисковый индекс обновляется.

## 6. ТЕХНИЧЕСКОЕ ЗАДАНИЕ
1. Prisma-миграции всех таблиц (включая enum'ы); raw-миграция для: CHECK-ограничений, `citext`, `pg_trgm`, `unaccent`, индексов (`GIN(tsv)`, `GIN(title gin_trgm_ops)`, FK-индексы), партиальных индексов `publish_status='published'`.
2. Реестр `predicate`: сид со всеми кодами, domain/range, cardinality, is_transitive, is_inferred; сервис валидации ребра.
3. Read-API (без админки):
   - `GET /zoos` (фильтры: country, city, yearFrom, yearTo, hasPrograms, hasThreatened, hasCoords; сортировки; пагинация; include-whitelist);
   - `GET /zoos/:slug` (include: species, programs, orgs, research, education, facilities, events, sources);
   - `GET /species`, `GET /species/:slug`;
   - `GET /taxa/:id/children`, `GET /taxa/:id/lineage`, `GET /taxonomy` (корень/дерево по рангу);
   - `GET /countries`, `GET /countries/:slug`, `GET /cities/:slug`;
   - `GET /programs`, `GET /programs/:slug`;
   - `GET /organizations`, `GET /organizations/:slug`;
   - `GET /research`, `GET /research/:slug`;
   - `GET /stats`, `GET /stats/highlights`.
4. SQL-представления: `v_zoo_geo`, `v_taxon_lineage`, `v_zoo_program_species`, `v_zoo_threatened`, `v_related_zoos`, `v_related_species` (R1–R6), с комментариями и тестами.
5. `mv_search_index` + `search_synonym`; `pnpm search:refresh`; refresh после сидов/мутаций (на этапе 3 — только CLI).
6. Сид-фреймворк: `database/seeds/*.json` (country, city, zoo, taxon, profile, program, org, research, source, edges), загрузчик с валидацией zod, порядок, идемпотентность (`upsert` по естественным ключам), `sourceRefs` → `entity_source`.
7. CLI-скрипты: `data:check` (сироты, дубли, циклы, объекты без источника, битые slug/URL, стейл), `data:stale`, `db:seed`, `db:reset`.
8. Кэш: интерфейс `CacheStore` + in-memory LRU для справочников (TTL 60 с), без Redis.
9. Ошибки: 400 (неизвестный параметр), 404 (slug), 422 (валидация), 409 (конфликт), 429 (rate limit при необходимости).

## 7. ЗАДАЧИ
1. Миграции + проверка на чистой БД.
2. Репозитории и сервисы по модулям (geography, zoos, species, taxonomy, programs, organizations, research, sources, stats).
3. Мапперы → DTO; контрактные тесты.
4. SQL-представления и тесты на фикстурах.
5. Сид-загрузчик и 3–5 объектов на домен с реальными источниками (официальные сайты), помеченными `verified_at`.
6. `data:check` в CI на тестовой БД.
7. Индексы и `EXPLAIN ANALYZE` ключевых запросов; отчёт в PR.

## 8. ТЕХНОЛОГИЧЕСКИЕ ОГРАНИЧЕНИЯ
- Только Prisma + raw SQL миграции; никаких ORM поверх ORM.
- Никакого `SELECT *` в API-репозиториях.
- Все списки — с `limit` по умолчанию (24) и максимумом 100.
- Никаких строковых дат/чисел.

## 9. КАЧЕСТВО
- Repository возвращает доменные объекты, не Prisma-модели.
- Никакой логики в контроллерах.
- N+1 запрещён: `include`/`select` осознанно; для списков — только нужные поля.
- Транзакции для многoтабличных операций.

## 10. БЕЗОПАСНОСТЬ
- Только параметризованные запросы; `$queryRaw` — с `Prisma.sql`, без конкатенации.
- Сортировки/включаемые поля — строгий whitelist (иначе 400).
- Никаких приватных данных в публичных DTO.

## 11. GITHUB
Ветка `stage/3-data-model`; один PR; миграция одна; в описании — план отката (drop/recreate допустим только в dev).

## 12. PRE-FLIGHT
Проверить: этап 2 принят; БД пустая; `.env` содержит `DATABASE_URL` с портом 5433; `prisma validate` зелёный.

## 13. СОВМЕСТИМОСТЬ
Если в существующем коде есть эндпоинты — сохранить пути; при необходимости добавить alias и пометить deprecated. Не ломать контракты, уже используемые web.

## 14. ТЕСТЫ
- DB: все CHECK (год, координаты, counts, weight min/max), каскады, запрет self-loop ребра, уникальности.
- R1–R6: по 2+ кейса каждый; R5 — симметричность; R2 — глубина.
- API: каждый маршрут happy + error (404, 400); пагинация; фильтры комбинируются; include-whitelist.
- Seed: двойной прогон не создаёт дублей; `data:check` без ошибок.
- Контракт: ответы соответствуют zod-схемам.

## 15. КРИТЕРИИ ПРИЁМКИ
- [ ] `prisma migrate reset --force` + `pnpm db:seed` — успех.
- [ ] Повторный сид идемпотентен (количество строк не растёт).
- [ ] Все read-эндпоинты отдают данные, ошибки корректны.
- [ ] R1–R6 покрыты тестами и совпадают с `docs/INFERENCE.md`.
- [ ] `data:check` зелёный; CI зелёный.
- [ ] `EXPLAIN` ключевых запросов без seq scan на больших таблицах (в тестовых данных ≥ 10k строк генерируются только в тестах).
- [ ] Отчёт по шаблону.

## 16. ОТЧЁТ
По шаблону + примеры `curl` для 5 эндпоинтов + результаты `EXPLAIN ANALYZE` (кратко) + список индексов.

## 17. ЗАПРЕЩЕНО
- Делать админку/поиск/граф (это этапы 5–7).
- Хранить вычисляемые факты (R3/R5) в таблицах.
- Подставлять демо-данные «чтобы страница открылась».
- Ослаблять CHECK ради прохождения сида.
- Менять схему без миграции.
