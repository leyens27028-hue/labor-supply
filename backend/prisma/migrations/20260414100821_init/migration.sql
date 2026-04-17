-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'SALE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "team_id" TEXT,
    CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "lead_id" TEXT NOT NULL,
    CONSTRAINT "teams_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "collaborators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "id_card" TEXT,
    "address" TEXT,
    "bank_account" TEXT,
    "bank_name" TEXT,
    "note" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "sale_id" TEXT NOT NULL,
    CONSTRAINT "collaborators_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "note" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "factories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "note" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vendor_factories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendor_id" TEXT NOT NULL,
    "factory_id" TEXT NOT NULL,
    "employment_type" TEXT NOT NULL,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_factories_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vendor_factories_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recruitment_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "factory_id" TEXT NOT NULL,
    "employment_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "gender_requirement" TEXT NOT NULL DEFAULT 'ANY',
    "age_min" INTEGER,
    "age_max" INTEGER,
    "requirements" TEXT,
    "commission_per_hour" DECIMAL NOT NULL,
    "special_bonus" DECIMAL,
    "special_bonus_condition" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "created_by_id" TEXT NOT NULL,
    "assigned_sale_id" TEXT,
    "deadline" DATETIME,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "recruitment_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "recruitment_orders_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "recruitment_orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "recruitment_orders_assigned_sale_id_fkey" FOREIGN KEY ("assigned_sale_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "full_name" TEXT NOT NULL,
    "id_card" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "gender" TEXT NOT NULL DEFAULT 'ANY',
    "date_of_birth" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "employment_type" TEXT,
    "factory_id" TEXT,
    "start_date" DATETIME,
    "sale_id" TEXT,
    "collaborator_id" TEXT,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "workers_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "workers_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "workers_collaborator_id_fkey" FOREIGN KEY ("collaborator_id") REFERENCES "collaborators" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worker_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worker_id" TEXT NOT NULL,
    "recruitment_order_id" TEXT NOT NULL,
    "assigned_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    CONSTRAINT "worker_assignments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "worker_assignments_recruitment_order_id_fkey" FOREIGN KEY ("recruitment_order_id") REFERENCES "recruitment_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "working_hours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worker_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "total_hours" DECIMAL NOT NULL,
    "entered_by_id" TEXT NOT NULL,
    "entered_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "working_hours_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "working_hours_entered_by_id_fkey" FOREIGN KEY ("entered_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "salaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "base_salary" DECIMAL NOT NULL,
    "total_hours" DECIMAL NOT NULL,
    "commission_rate" DECIMAL NOT NULL,
    "commission_amount" DECIMAL NOT NULL,
    "total_bonus" DECIMAL NOT NULL DEFAULT 0,
    "total_salary" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "salaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "salary_bonuses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salary_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "salary_bonuses_salary_id_fkey" FOREIGN KEY ("salary_id") REFERENCES "salaries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "salary_bonuses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_data" TEXT,
    "new_data" TEXT,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_lead_id_key" ON "teams"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "collaborators_id_card_key" ON "collaborators"("id_card");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_factories_vendor_id_factory_id_employment_type_key" ON "vendor_factories"("vendor_id", "factory_id", "employment_type");

-- CreateIndex
CREATE UNIQUE INDEX "workers_id_card_key" ON "workers"("id_card");

-- CreateIndex
CREATE UNIQUE INDEX "worker_assignments_worker_id_recruitment_order_id_key" ON "worker_assignments"("worker_id", "recruitment_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "working_hours_worker_id_month_year_key" ON "working_hours"("worker_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "salaries_user_id_month_year_key" ON "salaries"("user_id", "month", "year");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
