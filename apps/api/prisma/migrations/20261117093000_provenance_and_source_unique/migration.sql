-- Единственный источник идентифицируется URL; дата устаревания провенанса.
ALTER TABLE "source" ADD CONSTRAINT "source_url_key" UNIQUE ("url");

ALTER TABLE "entity_source" ADD COLUMN "stale_after" DATE;
