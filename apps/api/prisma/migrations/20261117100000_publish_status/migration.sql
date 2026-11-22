ALTER TABLE "taxon" ADD COLUMN "publish_status" "PublishStatus" NOT NULL DEFAULT 'published';
ALTER TABLE "organization" ADD COLUMN "publish_status" "PublishStatus" NOT NULL DEFAULT 'published';
ALTER TABLE "research_project" ADD COLUMN "publish_status" "PublishStatus" NOT NULL DEFAULT 'draft';
