const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Tạo Admin mặc định
  const adminPassword = await bcrypt.hash('admin123', 10);
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
  console.log('✓ Admin:', admin.email);

  // 2. Tạo Giám đốc
  const directorPassword = await bcrypt.hash('director123', 10);
  const director = await prisma.user.upsert({
    where: { email: 'giamdoc@company.vn' },
    update: {},
    create: {
      email: 'giamdoc@company.vn',
      password: directorPassword,
      fullName: 'Nguyễn Văn Giám Đốc',
      phone: '0900000002',
      role: 'DIRECTOR',
    },
  });
  console.log('✓ Giám đốc:', director.email);

  // 3. Tạo Trưởng nhóm
  const leadPassword = await bcrypt.hash('lead123', 10);
  const lead = await prisma.user.upsert({
    where: { email: 'truongnhom@company.vn' },
    update: {},
    create: {
      email: 'truongnhom@company.vn',
      password: leadPassword,
      fullName: 'Trần Thị Trưởng Nhóm',
      phone: '0900000003',
      role: 'TEAM_LEAD',
    },
  });
  console.log('✓ Trưởng nhóm:', lead.email);

  // 4. Tạo Team
  const team = await prisma.team.upsert({
    where: { leadId: lead.id },
    update: {},
    create: {
      name: 'Nhóm Sale 1',
      leadId: lead.id,
    },
  });
  console.log('✓ Team:', team.name);

  // Gắn Trưởng nhóm vào team
  await prisma.user.update({
    where: { id: lead.id },
    data: { teamId: team.id },
  });

  // 5. Tạo 2 Sale mẫu
  const salePassword = await bcrypt.hash('sale123', 10);

  const sale1 = await prisma.user.upsert({
    where: { email: 'sale1@company.vn' },
    update: {},
    create: {
      email: 'sale1@company.vn',
      password: salePassword,
      fullName: 'Lê Văn Sale 1',
      phone: '0900000004',
      role: 'SALE',
      teamId: team.id,
    },
  });
  console.log('✓ Sale 1:', sale1.email);

  const sale2 = await prisma.user.upsert({
    where: { email: 'sale2@company.vn' },
    update: {},
    create: {
      email: 'sale2@company.vn',
      password: salePassword,
      fullName: 'Phạm Thị Sale 2',
      phone: '0900000005',
      role: 'SALE',
      teamId: team.id,
    },
  });
  console.log('✓ Sale 2:', sale2.email);

  console.log('\n=== Seed hoàn tất ===');
  console.log('Tài khoản đăng nhập:');
  console.log('  Admin:       admin@company.vn / admin123');
  console.log('  Giám đốc:   giamdoc@company.vn / director123');
  console.log('  Trưởng nhóm: truongnhom@company.vn / lead123');
  console.log('  Sale 1:      sale1@company.vn / sale123');
  console.log('  Sale 2:      sale2@company.vn / sale123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
