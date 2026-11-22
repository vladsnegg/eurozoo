# Отчёт о данных — этап 8

Дата сбора и проверки: **2026-11-19**. Правило проекта: «нет источника — нет факта».
Все опубликованные объекты имеют минимум один `entity_source` со `status = current` и заполненным `verified_at`.

## 1. Покрытие

| Сущность | Факт | Минимум этапа 8 |
|---|---:|---:|
| Зоопарки | 38 | 30 |
| Страны | 49 | 12 |
| Города | 70 | 25 |
| Виды (с профилем) | 113 | 60 |
| Изображения видов | 113 (Wikimedia Commons) | — |
| Таксоны всего (класс → вид) | 278 | — |
| Организации | 10 | 10 |
| Программы сохранения | 81 (66 EEP, 14 STUDBOOK, 1 ESB) | 15 |
| Исследования | 11 | 8 |
| Образовательные программы | 22 | 20 |
| Источники | 544 | 80 |
| `zoo_species` | 250 | 150 |
| `zoo_program` | 121 | 60 |
| Рёбра графа | 605 | 40 |

`pnpm data:check` — все проверки зелёные; `pnpm data:verify` — 0 ошибок, 0 предупреждений.

## 2. Зоопарки по странам

| Страна | Зоопарков | Страна | Зоопарков |
|---|---:|---|---:|
| Германия | 7 | Австрия | 1 |
| Нидерланды | 3 | Беларусь | 1 |
| Польша | 3 | Венгрия | 1 |
| Бельгия | 2 | Дания | 1 |
| Великобритания | 2 | Ирландия | 1 |
| Испания | 2 | Италия | 1 |
| Франция | 2 | Латвия | 1 |
| Швейцария | 2 | Литва | 1 |
|  |  | Норвегия | 1 |
|  |  | Португалия | 1 |
|  |  | Украина | 1 |
|  |  | Финляндия | 1 |
|  |  | Чехия | 1 |
|  |  | Швеция | 1 |
|  |  | Эстония | 1 |

Страны: 49 европейских государств (включая Восточную Европу, Балканы, Южный Кавказ и Турцию; Россия исключена). Зоопарки атласа представлены в 23 из них.

В среднем 7,8 подтверждённых вида на зоопарк, у которого есть каталог животных (минимум 6, максимум 8). У 6 зоопарков публичный каталог видов не найден — 0.

## 3. Виды и охранный статус

У каждого вида есть локальное изображение в `apps/web/public/species/` и атрибуция Wikimedia Commons (`image_credit_url`).
| IUCN | Видов |
|---|---:|
| EN — исчезающий | 28 |
| LC — вызывающий наименьшие опасения | 26 |
| VU — уязвимый | 25 |
| CR — на грани исчезновения | 17 |
| NT — близкий к уязвимому | 14 |
| EW — исчез в дикой природе | 2 |
| DD — данных недостаточно | 1 |

Таксономия: 278 таксонов, линия каждого вида доходит до семейства, рода и вида; циклов нет (`data:check`).
Таксономическая основа и авторы названий сверены с GBIF; охранный статус — с IUCN Red List.

## 4. Программы, организации, исследования, образование

- 81 программа: 66 EEP, 14 STUDBOOK, 1 ESB. 80 опубликованы; 1 черновик (`EEP: Panthera tigris`) — статус требует подтверждения EAZA.
- 10 организаций: EAZA, WAZA, IUCN, BIAZA, VdZ, Species360, ESF, Stiftung Artenschutz, AIZA, NVD.
- 11 исследований: проекты Берлина, Тирпарка Берлина, Праги (2), Лейпцига (2), Шёнбрунна, Цюриха, Франкфурта (2), Барселоны.
- 22 образовательные программы у 15 зоопарков (школьные туры, мастерские, лекции, курсы).
- 121 связь «зоопарк — программа»; указаны только случаи, когда официальный сайт зоопарка называет вид и программу (участие, координация или ведение племенной книги).

## 5. Источники и провенанс

| Тип источника | Надёжность | Записей |
|---|---|---:|
| `official_site` | `official` | 386 |
| `database` | `database` | 113 (GBIF) |
| `official_site` | `database` | 33 (OpenStreetMap, координаты) |
| `official_site` | `scientific` | 1 |
| `database` | `scientific` | 1 (IUCN Red List) |

Уникальных доменов: 56. Ключевые источники:

- EAZA: `https://www.eaza.net/eep-pages/` и официальный перечень программ `EAZA Ex-situ Programme overview (April 2026)`.
- IUCN Red List: `https://www.iucnredlist.org`.
- GBIF: `https://www.gbif.org/species/<key>` — по одной странице на вид.
- OpenStreetMap — координаты зоопарков (по одной ссылке на объект).
- Официальные сайты 38 зоопарков — история, животные, программы, исследования, образование.

Домены источников перечислены в `apps/api/data/source-allowlist.json`; полный список 544 источников — в `apps/api/prisma/seeds/sources.json`.

Проверка доступности: `pnpm data:verify:online` загрузил все 544 URL. Страницы зоопарков, EAZA, IUCN, OSM и ассоциаций отвечают HTTP 200. GBIF отдаёт HTTP 403 автоматическим клиентам (антибот-защита), при этом страницы открываются в браузере и API GBIF использовался при сборе; это не битые ссылки.

## 6. Выборочная проверка 10% (25 из 250 связей «зоопарк — вид»)

Каждая связь в сиде содержит URL конкретной страницы животного. Для выборочной сверки взята каждая 10-я запись; все 25 подтверждены официальными страницами 2026-11-19.

| # | Зоопарк | Вид | Источник |
|---:|---|---|---|
| 1 | artis-amsterdam | Ailurus fulgens | https://www.artis.nl/nl/artis-park/te-zien-in-artis-park/kleine-panda |
| 2 | bioparc-valencia | Gorilla gorilla | https://bioparcvalencia.es/animal/gorila-occidental-de-llanura/ |
| 3 | burgers-zoo | Panthera tigris | https://www.burgerszoo.nl/wiki/dieren/tijger |
| 4 | dublin-zoo | Ailurus fulgens | https://www.dublinzoo.ie/animals/red-panda/ |
| 5 | edinburgh-zoo | Giraffa camelopardalis | https://www.edinburghzoo.org.uk/animals/animal-inhabitants/nubian-giraffe |
| 6 | hagenbeck | Spheniscus humboldti | https://www.hagenbeck.de/de/tierpark/tiere/steckbriefe/pinguine_humboldt.php |
| 7 | hellabrunn | Ursus maritimus | https://www.hellabrunn.de/tiere/polarwelt/eisbaer |
| 8 | kolmarden | Elephas maximus | https://www.kolmarden.com/djurpark/djur/elefant |
| 9 | korkeasaari | Lynx lynx | https://korkeasaari.fi/elain/ilves/ |
| 10 | kristiansand-dyrepark | Panthera tigris | https://www.dyreparken.no/dyr/tiger/ |
| 11 | lisbon-zoo | Suricata suricatta | https://www.zoo.pt/pt/conhecer/animais/mamiferos/suricata/ |
| 12 | parc-zoologique-paris | Canis lupus | https://www.parczoologiquedeparis.fr/fr/loup-iberique |
| 13 | rotterdam-zoo | Panthera pardus | https://diergaardeblijdorp.nl/nl/ontdek/dieren-planten/amoerpanter |
| 14 | tallinn-zoo | Panthera uncia | https://tallinnzoo.ee/animal/irbis-e-lumeleopard/ |
| 15 | tierpark-berlin | Ailurus fulgens | https://www.tierpark-berlin.de/de/tierpark-erleben/tiere-erlebniswelten/kleiner-panda |
| 16 | zoo-barcelona | Gorilla gorilla | https://zoobarcelona.cat/ca/animals/gorilla-de-plana-occidental |
| 17 | zoo-basel | Okapia johnstoni | https://www.zoobasel.ch/de/tiere/tierlexikon/tierbeschreibung/97/okapi/ |
| 18 | zoo-beauval | Pongo pygmaeus | https://www.zoobeauval.com/zooparc/liste-des-animaux/orang-outan |
| 19 | zoo-budapest | Gorilla gorilla | https://zoobudapest.com/aktualis/orangutanok-a-budapesti-allatkertben/ |
| 20 | zoo-copenhagen | Pan troglodytes | https://www.zoo.dk/vores-dyr |
| 21 | zoo-frankfurt | Tragelaphus eurycerus | https://www.zoo-frankfurt.de/de/unsere-tiere/tiere-von-a-z/tiere-von-a-z-detailansicht/bongo-ostafrikanischer |
| 22 | zoo-leipzig | Alligator mississippiensis | https://www.zoo-leipzig.de/tier/mississippi-alligator/ |
| 23 | zoo-praha | Equus przewalskii | https://www.zoopraha.cz/zvirata-a-expozice/lexikon-zvirat?d=192-kun-prevalskeho&start=192 |
| 24 | zoo-warsaw | Panthera leo | https://zoo.waw.pl/wizyta-w-zoo/mieszkancy-zoo |
| 25 | zoo-wroclaw | Rhinoceros unicornis | https://www.zoo.wroclaw.pl/zwierzeta/nosorozec-indyjski/ |

## 7. Известные пробелы

1. **Zoo Antwerpen** не публикует каталог животных — связей `zoo_species` нет.
2. Списки видов у зоопарков не претендуют на полноту: собрано 6–8 подтверждённых видов на зоопарк, а не весь каталог.
3. Подвиды сведены к виду (`Panthera tigris altaica` → `Panthera tigris`); исходный подвид сохранён в `note`.
4. Числовые характеристики видов (вес, длина, продолжительность жизни) в основном не заполнены: значения не выдумывались, поля остаются `NULL`.
5. Участие в EEP/ESB зафиксировано только при явном указании вида и программы на официальном сайте; полные списки участников EAZA доступны только членам ассоциации.
6. Один черновик программы (`EEP: Panthera tigris`) не опубликован до подтверждения статуса в EAZA.
7. Статусы IUCN следует периодически перепроверять: оценки меняются (например, пиренейская рысь повышена до VU в 2024 году).

## 8. Воспроизводимость

```bash
pnpm db:reset
pnpm db:seed
pnpm data:verify
pnpm data:check
```

Повторный сид идемпотентен: все сущности загружаются через `upsert` по естественным ключам, повторный запуск не создаёт дублей и не меняет количество строк (кроме даты `updated_at`).
