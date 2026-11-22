# API v1 — контракты

База: `/api/v1`. JSON UTF-8. Ошибки — RFC 7807. Схемы ответов — `packages/shared/src/dto` (zod), имена указаны в колонке «Схема».

## Общие правила

- Пагинация: `page` (≥1, по умолчанию 1), `pageSize` (1..100, по умолчанию 24), `sort` (whitelist), `order` (`asc|desc`).
- Неизвестный query-параметр → `400`.
- Публичные списки отдают только `published`; админ — все.
- `include` — whitelist на маршрут; неверное значение → `400`.
- Кэш: `Cache-Control: public, max-age=60, stale-while-revalidate=300` (кроме `/auth`, `/admin`).
- Ошибки: `400` параметры, `401` нет сессии, `403` роль, `404` slug, `409` конфликт, `422` доменная валидация, `429` лимит, `500`.

## Публичные маршруты

| Метод | Путь | Параметры | Схема ответа |
|---|---|---|---|
| GET | `/health` | — | `HealthDto` |
| GET | `/stats` | — | `StatsDto` |
| GET | `/stats/highlights` | `limit=5` | `HighlightsDto` |
| GET | `/zoos` | `country,city,yearFrom,yearTo,hasPrograms,hasThreatened,hasCoords,page,pageSize,sort,order` | `Paginated<ZooSummaryDto>` |
| GET | `/zoos/:slug` | `include=species,programs,organizations,research,education,facilities,events,sources` | `ZooDetailDto` |
| GET | `/species` | `iucn,class,order,family,habitat,hasPrograms,country,page,pageSize,sort` | `Paginated<SpeciesSummaryDto>` |
| GET | `/species/:slug` | `include=lineage,zoos,programs,research,sources` | `SpeciesDetailDto` |
| GET | `/taxonomy` | `rank` | `TaxonNodeDto[]` (корни/уровень) |
| GET | `/taxa/:id/children` | `page,pageSize` | `Paginated<TaxonNodeDto>` |
| GET | `/taxa/:id/lineage` | — | `TaxonLineageDto` |
| GET | `/countries` | `page,pageSize,sort` | `Paginated<CountrySummaryDto>` |
| GET | `/countries/:slug` | — | `CountryDetailDto` |
| GET | `/cities/:slug` | — | `CityDetailDto` |
| GET | `/programs` | `code,status,organization,country,page,pageSize,sort` | `Paginated<ProgramSummaryDto>` |
| GET | `/programs/:slug` | — | `ProgramDetailDto` |
| GET | `/organizations` | `type,country,page,pageSize,sort` | `Paginated<OrganizationSummaryDto>` |
| GET | `/organizations/:slug` | — | `OrganizationDetailDto` |
| GET | `/research` | `status,yearFrom,yearTo,country,page,pageSize` | `Paginated<ResearchSummaryDto>` |
| GET | `/research/:slug` | — | `ResearchDetailDto` |
| GET | `/sources` | `type,reliability,page,pageSize` | `Paginated<SourceDto>` |
| GET | `/search` | `q,types,country,iucn,programCode,page,pageSize` | `SearchResponseDto` |
| GET | `/graph` | `seed,depth,types,predicates,inferred,limit` | `GraphResponseDto` |
| GET | `/entities/:type/:id/related` | `limit=8` | `RelatedGroupDto[]` |
| GET | `/entities/:type/:id/similar` | `limit=4` | `SimilarEntityDto[]` |

## Авторизация

| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| POST | `/auth/login` | `{email,password}` | `{user: UserDto}` + `Set-Cookie` |
| POST | `/auth/logout` | — | `204` |
| GET | `/auth/me` | — | `{user: UserDto}` / `401` |

## Админ (роли EDITOR/ADMIN)

| Ресурс | Маршруты |
|---|---|
| zoos, taxa, countries, regions, cities, programs, organizations, research, education, facilities, events, sources, synonyms | `GET /admin/:resource`, `GET /admin/:resource/:id`, `POST`, `PATCH /:id`, `DELETE /:id` (только ADMIN) |
| Связи | `PUT /admin/:resource/:id/relations/:relation` |
| Публикация | `POST /admin/:resource/:id/publish`, `POST /admin/:resource/:id/verify` |
| Пользователи | `GET /admin/users`, `PATCH /admin/users/:id`, `POST /admin/users` (ADMIN) |
| Ревизии | `GET /admin/revisions?entityType&entityId&actorId&page` |
| Индекс поиска | `POST /admin/search/refresh` (ADMIN) |

## Коды ошибок по типам

| `type` | HTTP | Когда |
|---|---|---|
| `validation_error` | 400/422 | неверные параметры/нарушен инвариант |
| `unauthorized` | 401 | нет/истекла сессия |
| `forbidden` | 403 | роль недостаточна |
| `not_found` | 404 | сущность не найдена |
| `conflict` | 409 | `updated_at` не совпал; удаление с зависимостями |
| `rate_limited` | 429 | лимит логина/поиска |
| `internal_error` | 500 | непредвиденная ошибка (без стектрейса) |

## Примеры

```http
GET /api/v1/zoos?country=cz&hasPrograms=true&sort=foundedYear&order=asc&page=1&pageSize=24
```
```json
{
  "items": [{
    "id": "…", "slug": "zoo-praha", "name": "Zoo Praha",
    "city": {"name": "Прага", "slug": "praha", "country": {"name": "Чехия", "slug": "czechia"}},
    "foundedYear": 1931, "speciesCount": 12, "hasPrograms": true
  }],
  "total": 1, "page": 1, "pageSize": 24
}
```
```http
GET /api/v1/graph?seed=zoo:<uuid>&depth=2&types=zoo,species,program&inferred=true
```
```json
{
  "nodes": [{"type":"zoo","id":"…","label":"Zoo Praha","url":"/zoos/zoo-praha","degree":3}],
  "edges": [{"src":"…","dst":"…","predicate":"KEEPS","labelRu":"содержит","confidence":0.9,"inferred":false}],
  "truncated": false,
  "stats": {"nodes": 12, "edges": 15}
}
```
