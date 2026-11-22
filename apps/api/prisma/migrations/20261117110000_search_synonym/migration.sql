CREATE TABLE "search_synonym" (
    "id" UUID NOT NULL,
    "term" TEXT NOT NULL,
    "synonym" TEXT NOT NULL,
    "language" CHAR(2) NOT NULL DEFAULT 'ru',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    CONSTRAINT "search_synonym_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "search_synonym_term_synonym_key" ON "search_synonym"("term", "synonym");
