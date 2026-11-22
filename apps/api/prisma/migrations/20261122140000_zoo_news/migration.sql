-- Zoo news feed for curated official updates.
CREATE TABLE "zoo_news" (
    "id" UUID NOT NULL,
    "zoo_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "url" TEXT NOT NULL,
    "source_name" TEXT,
    "published_at" DATE NOT NULL,
    "publish_status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zoo_news_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "zoo_news_zoo_id_published_at_idx" ON "zoo_news"("zoo_id", "published_at");
CREATE INDEX "zoo_news_publish_status_published_at_idx" ON "zoo_news"("publish_status", "published_at");

ALTER TABLE "zoo_news" ADD CONSTRAINT "zoo_news_zoo_id_fkey" FOREIGN KEY ("zoo_id") REFERENCES "zoo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
