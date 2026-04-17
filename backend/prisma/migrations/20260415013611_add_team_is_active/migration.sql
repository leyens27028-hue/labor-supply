-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "lead_id" TEXT NOT NULL,
    CONSTRAINT "teams_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_teams" ("created_at", "id", "lead_id", "name", "updated_at") SELECT "created_at", "id", "lead_id", "name", "updated_at" FROM "teams";
DROP TABLE "teams";
ALTER TABLE "new_teams" RENAME TO "teams";
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");
CREATE UNIQUE INDEX "teams_lead_id_key" ON "teams"("lead_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
