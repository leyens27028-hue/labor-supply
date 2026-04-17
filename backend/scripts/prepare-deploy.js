/**
 * Script chuyển schema.prisma từ SQLite → PostgreSQL trước khi deploy
 * Chạy tự động trong build command trên Render
 */
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf-8');

// Chuyển provider từ sqlite → postgresql
const updated = schema.replace(
  /provider\s*=\s*"sqlite"/,
  'provider = "postgresql"'
);

if (updated !== schema) {
  fs.writeFileSync(schemaPath, updated);
  console.log('✅ Schema switched to PostgreSQL');
} else if (schema.includes('"postgresql"')) {
  console.log('✅ Schema already uses PostgreSQL');
} else {
  console.log('⚠️ Could not find sqlite provider in schema');
}
