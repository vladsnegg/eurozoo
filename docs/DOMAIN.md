# Доменная модель (операционный документ)

Полная модель: `docs/spec/04-knowledge-model.md`. Здесь — глоссарий, инварианты и правила, обязательные в коде.

## 1. Глоссарий

| Термин | Значение |
|---|---|
| Зоопарк | организация-учреждение, содержащее животных; принадлежит городу |
| Таксон | узел дерева классификации любого ранга; вид — таксон ранга `species` |
| Профиль вида | видоспецифичные знания (IUCN, масса, продолжительность жизни) |
| Предикат | типизированное отношение (`KEEPS`, `PARTICIPATES_IN`, `PART_OF`) |
| Факт | значение атрибута или ребро графа |
| Провенанс | источник + дата получения + дата проверки + достоверность |
| Выведенный факт | результат правила R1–R6, не хранится в таблицах фактов |
| Публикация | статус `published`; требует ≥1 проверенного источника |

## 2. Сущности и ответственность

| Сущность | Ключ | Владелец модуля |
|---|---|---|
| Country / Region / City | `id`, естественные uniq | geography |
| Zoo / ZooEvent / Enclosure / Facility | `id`, `slug` | zoos |
| TaxonomicRank / Taxon / SpeciesProfile / IucnStatus / Habitat | `id`, `scientific_name` | species, taxonomy |
| ConservationProgram / ProgramSpecies / ZooProgram | `id`, `slug` | programs |
| Organization | `id`, `slug` | organizations |
| ResearchProject | `id`, `slug` | research |
| EducationProgram | `id` | zoos |
| Source / EntitySource | `id` | sources |
| Predicate / KnowledgeEdge | `id`, `code` | graph |
| AppUser / Session | `id`, `email` | auth |
| KnowledgeRevision | `bigserial` | admin |

## 3. Инварианты (проверяются сервисами и БД)

1. `zoo.city_id` обязателен; `zoo.slug` уникален.
2. `city.country_id` обязателен; `region_id` опционален.
3. `taxon.parent_id` — только для не-корня; циклы запрещены; `species` обязан иметь родителя ранга `genus`.
4. `species_profile` существует ⇔ `taxon.rank.code = 'species'`.
5. `founded_year`, `year`, `started_year`, `ended_year` ∈ [1200; 2100]; `until ≥ since`.
6. Координаты: `lat ∈ [34;72]`, `lng ∈ [−25;45]` (если заданы).
7. `count_* ≥ 0`; `area_ha > 0`; `weight_kg_min ≤ weight_kg_max`.
8. Ребро: домен/диапазон совпадают с типами; нет self-loop; уникально по (src, predicate, dst).
9. `published` требует `entity_source` c `status='current'` и `verified_at`.
10. `NULL` означает «неизвестно»; подстановка 0/false запрещена.

## 4. Правила отсутствия данных

- Нет IUCN → бейдж «статус не указан», страница работает.
- Нет координат → зоопарк не на карте, но в каталоге (фильтр).
- Нет региона → цепочка `city → country` работает.
- Нет источника у draft — нормально; у published — запрещено.

## 5. Расширение

- Новый ранг таксона — строка в `taxonomic_rank` (без миграции).
- Новый предикат — строка в `predicate` + whitelist графа.
- Новый тип сущности — значение `entity_type` + resolver проекции.

## 6. Запрещено

Хранить вычисляемые агрегаты R1–R6 как факты; дублировать таксономические уровни отдельными таблицами; добавлять поля «на будущее»; подставлять демо-данные вместо пустых состояний.
