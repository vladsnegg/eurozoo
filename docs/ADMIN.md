# Административная панель и безопасность

## Аутентификация

- `POST /api/v1/auth/login` `{email, password}` → cookie `eurozoo_session` (httpOnly, SameSite=Lax, Secure в prod, 7 дней).
- `POST /api/v1/auth/logout` — удаляет серверную сессию и cookie.
- `GET /api/v1/auth/me` — текущий пользователь.
- Пароли — Argon2id (memory 19 MiB, iterations 2, parallelism 1, hash 32 байта, salt 16 байт) через `hash-wasm` (WASM, без нативных сборок).
- В БД хранится SHA-256 от токена сессии, не сам токен.
- Rate limit логина: 5 попыток/мин на IP, 10/час на аккаунт, блокировка 15 мин после 10 неудач (in-memory, один экземпляр API).
- CSRF: для не-GET запросов при наличии заголовка `Origin` он обязан совпадать с `WEB_ORIGIN`.

## Роли

| Действие | viewer | editor | admin |
|---|---|---|---|
| Публичные страницы/поиск/граф | ✅ | ✅ | ✅ |
| Вход в `/admin` | ❌ 403 | ✅ | ✅ |
| Список/просмотр админ-ресурсов | ❌ | ✅ | ✅ |
| Создание/редактирование | ❌ | ✅ | ✅ |
| Публикация | ❌ | ✅ | ✅ |
| Удаление | ❌ | ❌ 403 | ✅ |
| Источники/синонимы | ❌ | ✅ | ✅ |
| Пользователи | ❌ | ❌ 403 | ✅ |
| Журнал ревизий | ❌ | ✅ | ✅ |

## Админ-API

`/admin/:resource` — CRUD для `zoos, taxa, countries, regions, cities, programs, organizations, research, education, facilities, events, sources, synonyms`.

- `GET /admin/:resource?q&page&pageSize` — список (все статусы).
- `GET/POST/PATCH/DELETE /admin/:resource/:id`.
- `POST /admin/:resource/:id/publish` — требует `entity_source` c `current` и `verified_at`.
- `POST /admin/:resource/:id/verify` `{sourceId}` — проставляет `verified_at=now`, `stale_after=+1 год`.
- `PUT /admin/:resource/:id/relations/:relation` `{ids}` — M:N: `zoos:species|programs|organizations`, `programs:species|zoos`, `organizations:zoos`, `research:zoos|species`.
- `GET /admin/revisions?entityType&entityId&page`.
- `GET /admin/users`, `POST /admin/users`, `PATCH /admin/users/:id` (нельзя лишить систему последнего админа).
- `POST /admin/search/refresh` — `REFRESH MATERIALIZED VIEW CONCURRENTLY`.

## Публикация и провенанс

1. Создать/отредактировать сущность (статус `draft`).
2. Добавить `source` и связать с сущностью (`entity_source`) — через API/сид.
3. `verify` фиксирует проверку.
4. `publish` переводит в `published`; без шагов 2–3 публикация возвращает `422`.

## Журнал

Каждая мутация пишет `knowledge_revision`: тип сущности, действие (`create/update/delete/publish/verify/user_update`), actor, diff (изменённые поля), время. Журнал доступен в `/admin/revisions`.

## Bootstrap

Администратор создаётся сидом при наличии `BOOTSTRAP_ADMIN_EMAIL` и `BOOTSTRAP_ADMIN_PASSWORD`. После первого входа пароль нужно сменить (пока через API/БД; UI смены пароля — этап 9).

## Ограничения

- Rate limit хранится в памяти процесса (корректно для одного экземпляра; при масштабировании — Redis).
- Нет UI создания пользователей и сброса пароля (API есть).
- Soft-404 и лимит поиска — см. `docs/KNOWN-ISSUES.md`.
