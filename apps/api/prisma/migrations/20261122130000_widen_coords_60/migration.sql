-- Extend the Europe coordinate envelope to cover the European part of Russia.
ALTER TABLE "city" DROP CONSTRAINT IF EXISTS "city_coords_europe";
ALTER TABLE "city" ADD CONSTRAINT "city_coords_europe" CHECK (
  ("lat" IS NULL OR ("lat" >= 34 AND "lat" <= 75)) AND
  ("lng" IS NULL OR ("lng" >= -25 AND "lng" <= 60))
);

ALTER TABLE "zoo" DROP CONSTRAINT IF EXISTS "zoo_coords_europe";
ALTER TABLE "zoo" ADD CONSTRAINT "zoo_coords_europe" CHECK (
  ("lat" IS NULL OR ("lat" >= 34 AND "lat" <= 75)) AND
  ("lng" IS NULL OR ("lng" >= -25 AND "lng" <= 60))
);
