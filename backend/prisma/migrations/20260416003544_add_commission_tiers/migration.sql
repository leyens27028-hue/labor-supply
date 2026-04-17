-- CreateTable
CREATE TABLE "commission_tiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "min_hours" INTEGER NOT NULL,
    "max_hours" INTEGER NOT NULL,
    "rate" DECIMAL NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "salary_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "note" TEXT,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "salary_configs_key_key" ON "salary_configs"("key");
