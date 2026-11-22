# Оценка качества поиска (SEARCH-EVAL)

Набор контрольных запросов и ожидаемая выдача. Используется в тестах (`test/search.spec.ts`) и для ручной проверки после изменений ранжирования. Дата фиксации: 2026-11-17, сид из `prisma/seeds`.

| # | Запрос | Ожидаемый топ-1 | Тип |
|---|---|---|---|
| 1 | `тигр` | Panthera tigris | species |
| 2 | `Tiger` | Panthera tigris | species |
| 3 | `панда` | Ailuropoda melanoleuca | species |
| 4 | `большая панда` | Ailuropoda melanoleuca | species |
| 5 | `малая панда` | Ailurus fulgens | species |
| 6 | `слон` | Loxodonta africana | species |
| 7 | `жираф` | Giraffa camelopardalis | species |
| 8 | `Felidae` | Panthera tigris | species |
| 9 | `Panthera` | Panthera tigris | species |
| 10 | `Ailurus` | Ailurus fulgens | species |
| 11 | `Прага` | Zoo Praha | zoo |
| 12 | `Praha` | Zoo Praha | zoo |
| 13 | `Вена` | Tiergarten Schönbrunn | zoo |
| 14 | `Берлин` | Tierpark Berlin | zoo |
| 15 | `Чехия` | Zoo Praha | zoo |
| 16 | `Германия` | Германия | country |
| 17 | `EAZA` | European Association of Zoos and Aquaria | organization |
| 18 | `Wrocław` / `Wroclaw` | Zoo Wrocław | zoo |
| 19 | `Artis` | Artis | zoo |
| 20 | `Ailuropoda` | Ailuropoda melanoleuca | species |

> Программы в статусе `draft` намеренно отсутствуют в публичном поиске (индекс строится только по опубликованным программам/организациям/исследованиям). Запрос `EEP` на текущем сиде даёт 0 результатов — это ожидаемое поведение до этапа 8.

## Дополнительные проверки

| Проверка | Ожидание |
|---|---|
| `тигрр` (опечатка) | 0 результатов + ≥1 подсказка |
| `Прага` + `types=zoo` | ровно 1 результат, группа `zoo` |
| пустой `q` | `400 validation_error` |
| спецсимволы `"&|!()*` | `200`, без 500 |
| запрос по семейству (`Felidae`) | находит виды-потомки благодаря названиям рода/семейства в индексе |

## Методика

1. Индекс `mv_search_index` объединяет zoo, species (+ род и семейство), country, city, program, organization, research.
2. Расширение запроса — `search_synonym` (26 пар), максимум 8 термов; язык — русский + английский.
3. Ранжирование: `ts_rank_cd` + `similarity(title, q) × 0.6` + буст типа (zoo/species 0.15, program 0.10).
4. Фолбэк: при 0 результатов — `word_similarity` по телу документа (подсказки).
5. Изменение ранжирования требует повторного прогона этой таблицы и обновления тестов.
