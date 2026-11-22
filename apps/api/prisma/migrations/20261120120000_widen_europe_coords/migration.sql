-- Расширение географического диапазона координат для стран Восточной Европы
-- и Южного Кавказа (Баку, Тбилиси, Ереван): долгота до 55°E.
ALTER TABLE "city" DROP CONSTRAINT IF EXISTS "city_coords_europe";
ALTER TABLE "city" ADD CONSTRAINT "city_coords_europe" CHECK (
  ("lat" IS NULL OR ("lat" >= 34 AND "lat" <= 72)) AND
  ("lng" IS NULL OR ("lng" >= -25 AND "lng" <= 55))
);

ALTER TABLE "zoo" DROP CONSTRAINT IF EXISTS "zoo_coords_europe";
ALTER TABLE "zoo" ADD CONSTRAINT "zoo_coords_europe" CHECK (
  ("lat" IS NULL OR ("lat" >= 34 AND "lat" <= 72)) AND
  ("lng" IS NULL OR ("lng" >= -25 AND "lng" <= 55))
);
