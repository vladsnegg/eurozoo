-- Изображения видов: URL в /public/species и атрибуция источника.
ALTER TABLE "taxon" ADD COLUMN "image_url" TEXT;
ALTER TABLE "taxon" ADD COLUMN "image_credit" TEXT;
ALTER TABLE "taxon" ADD COLUMN "image_credit_url" TEXT;
