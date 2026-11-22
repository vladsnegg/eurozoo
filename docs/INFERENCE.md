# Правила вывода R1–R6

Правила реализуются SQL-представлениями (миграция ЭТАПА 3), доступны только на чтение, в API помечаются `inferred=true`. В таблицах фактов не хранятся.

## R1 — География зоопарка

```sql
create or replace view v_zoo_geo as
select z.id as zoo_id, z.slug as zoo_slug, z.name as zoo_name,
       c.id as city_id, c.name as city_name, c.slug as city_slug,
       r.id as region_id, r.name as region_name,
       co.id as country_id, co.name as country_name, co.slug as country_slug, co.iso2
from zoo z
join city c on c.id = z.city_id
join country co on co.id = c.country_id
left join region r on r.id = c.region_id;
```

## R2 — Таксономическая линия

```sql
create or replace view v_taxon_lineage as
with recursive up as (
  select t.id as start_id, t.id as taxon_id, t.parent_id, t.scientific_name, t.rank_id, 0 as depth
  from taxon t
  union all
  select u.start_id, p.id, p.parent_id, p.scientific_name, p.rank_id, u.depth + 1
  from up u join taxon p on p.id = u.parent_id
)
select start_id, taxon_id, parent_id, scientific_name, rank_id, depth
from up;
```

Ожидание: глубина = числу предков; корень (`parent_id is null`) присутствует; циклы в данных запрещены, поэтому рекурсия завершается.

## R3 — Участие зоопарка в программе по виду (inferred)

```sql
create or replace view v_zoo_program_species as
select zp.zoo_id, ps.taxon_id, ps.program_id, zp.role as zoo_role, ps.role as species_role,
       true as inferred, coalesce(zp.since_year, cp.started_year) as since_year
from zoo_program zp
join program_species ps on ps.program_id = zp.program_id
join conservation_program cp on cp.id = zp.program_id;
```

Не дублирует `zoo_species`; в UI показывается отдельным блоком с бейджем «выведено».

## R4 — Виды под угрозой в зоопарке

```sql
create or replace view v_zoo_threatened as
select zs.zoo_id, zs.taxon_id, iu.code as iucn_code, iu.severity
from zoo_species zs
join species_profile sp on sp.taxon_id = zs.taxon_id
join iucn_status iu on iu.id = sp.iucn_status_id
where iu.severity >= 3;
```

Порог 3 = VU/EN/CR/EW/EX по шкале `iucn_status.severity` (0=NE,1=LC,2=NT,3=VU,4=EN,5=CR,6=EW,7=EX). Значение хранится в справочнике, а не в коде.

## R5 — Похожие зоопарки (Jaccard ≥ 0.2)

```sql
with s as (select zoo_id, taxon_id from zoo_species),
pairs as (
  select a.zoo_id as a_id, b.zoo_id as b_id,
         count(*) filter (where a.taxon_id = b.taxon_id) as inter,
         count(*) as union_approx
  from s a join s b on a.zoo_id <> b.zoo_id
  group by a.zoo_id, b.zoo_id
)
select a_id, b_id, inter::numeric / nullif(union_approx,0) as score
from pairs where inter > 0;
```

Реализация должна считать объединение корректно (не приближённо): интер/юнион по множествам видов и программ. Порог 0.2, сортировка по score; симметричность обязательна (тест).

## R6 — «Связано с»

```sql
select predicate, count(*) from knowledge_edge
where (src_type = $1 and src_id = $2) or (dst_type = $1 and dst_id = $2)
group by predicate
order by count(*) asc
limit 8;
```

Плюс структурные связи (FK) через сервис проекции. Направление учитывается; дубликаты устраняются. Приоритет — редким предикатам, затем свежести.

## Ограничения

- Все правила читают только `published`-сущности в публичном API (админ видит все).
- R3/R5 не материализуются; при необходимости кэшируются на 60 с в памяти.
- Тесты на фикстурах: R1 (3 страны), R2 (глубина), R3 (нет дублей с `KEEPS`), R4 (порог), R5 (симметрия), R6 (лимит и группировка).
