-- CreateTable
CREATE TABLE "public"."Annonce" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(255),
    "prix" VARCHAR(100),
    "ville" VARCHAR(100),
    "pieces" VARCHAR(50),
    "surface" VARCHAR(50),
    "lien" TEXT NOT NULL,
    "description" TEXT,
    "photos" JSONB,
    "agence" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_scraped" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Annonce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Annonce_lien_key" ON "public"."Annonce"("lien");
