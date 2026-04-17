/**
 * Seed dữ liệu ban đầu cho production
 * Chạy 1 lần sau deploy: node scripts/seed-production.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding production database...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('123456', 10);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.vn' },
    update: {},
    create: {
      email: 'admin@company.vn',
      password: adminPassword,
      fullName: 'Quản Trị Viên',
      phone: '0900000001',
      role: 'ADMIN',
    },
  });
  console.log('  Admin:', admin.email);

  // Director
  const director = await prisma.user.upsert({
    where: { email: 'director@company.vn' },
    update: {},
    create: {
      email: 'director@company.vn',
      password: userPassword,
      fullName: 'Giám Đốc',
      phone: '0900000002',
      role: 'DIRECTOR',
    },
  });
  console.log('  Director:', director.email);

  // Commission tiers
  const tiers = [
    { minHours: 0, maxHours: 800, rate: 0, note: 'Không có hoa hồng' },
    { minHours: 801, maxHours: 1500, rate: 2500, note: 'Bậc 1' },
    { minHours: 1501, maxHours: 5000, rate: 3500, note: 'Bậc 2' },
    { minHours: 5001, maxHours: 999999, rate: 4000, note: 'Bậc cao nhất' },
  ];

  for (const tier of tiers) {
    await prisma.commissionTier.upsert({
      where: { id: `seed-tier-${tier.minHours}` },
      update: {},
      create: { id: `seed-tier-${tier.minHours}`, ...tier },
    });
  }
  console.log('  Commission tiers: 4 bậc');

  // Base salary config
  await prisma.salaryConfig.upsert({
    where: { key: 'BASE_SALARY' },
    update: {},
    create: { key: 'BASE_SALARY', value: '5000000', note: 'Lương cơ bản (đ/tháng)' },
  });
  console.log('  Base salary: 5,000,000đ');

  console.log('\n✅ Seed hoàn tất!');
  console.log('  Đăng nhập: admin@company.vn / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
