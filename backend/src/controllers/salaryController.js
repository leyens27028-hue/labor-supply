const prisma = require('../config/prisma');
const { createAuditLog } = require('../utils/auditLog');
const { calculateSalary, calculateSalaryFromDB } = require('../utils/salaryCalculator');

/**
 * GET /api/salaries
 * Danh sách bảng lương
 */
async function getSalaries(req, res) {
  try {
    const { month, year, userId, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (userId) where.userId = userId;
    if (status) where.status = status;

    // Sale chỉ xem lương mình
    if (req.user.role === 'SALE') {
      where.userId = req.user.id;
    }

    const [salaries, total] = await Promise.all([
      prisma.salary.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          bonuses: true,
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip,
        take: parseInt(limit),
      }),
      prisma.salary.count({ where }),
    ]);

    res.json({
      success: true,
      data: salaries,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('GetSalaries error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * POST /api/salaries/calculate
 * Tính lương cho tất cả Sale trong tháng
 */
async function calculateAllSalaries(req, res) {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tháng và năm' });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    // Lấy tất cả Sale đang hoạt động
    const sales = await prisma.user.findMany({
      where: { role: 'SALE', isActive: true },
      select: { id: true, fullName: true },
    });

    const results = [];

    for (const sale of sales) {
      // Tổng giờ tất cả CN do Sale phụ trách trong tháng
      const hoursAgg = await prisma.workingHours.aggregate({
        where: {
          month: m,
          year: y,
          worker: { saleId: sale.id },
        },
        _sum: { totalHours: true },
      });

      const totalHours = Number(hoursAgg._sum.totalHours || 0);

      // Lấy tổng thưởng khác (nếu đã nhập)
      const existingSalary = await prisma.salary.findUnique({
        where: { userId_month_year: { userId: sale.id, month: m, year: y } },
        include: { bonuses: true },
      });

      const totalBonus = existingSalary
        ? existingSalary.bonuses.reduce((sum, b) => sum + Number(b.amount), 0)
        : 0;

      const calc = await calculateSalaryFromDB(totalHours, totalBonus);

      // Upsert bảng lương
      const salary = await prisma.salary.upsert({
        where: { userId_month_year: { userId: sale.id, month: m, year: y } },
        update: {
          baseSalary: calc.baseSalary,
          totalHours: calc.totalHours,
          commissionRate: calc.commissionRate,
          commissionAmount: calc.commissionAmount,
          totalBonus: calc.totalBonus,
          totalSalary: calc.totalSalary,
        },
        create: {
          userId: sale.id,
          month: m,
          year: y,
          baseSalary: calc.baseSalary,
          totalHours: calc.totalHours,
          commissionRate: calc.commissionRate,
          commissionAmount: calc.commissionAmount,
          totalBonus: calc.totalBonus,
          totalSalary: calc.totalSalary,
        },
      });

      results.push({
        sale: sale.fullName,
        totalHours: calc.totalHours,
        commissionRate: calc.commissionRate,
        totalSalary: calc.totalSalary,
      });
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'salaries',
      entityId: `${m}-${y}`,
      newData: { month: m, year: y, count: results.length },
      description: `Tính lương T${m}/${y} cho ${results.length} Sale`,
    });

    res.json({ success: true, message: `Đã tính lương T${m}/${y} cho ${results.length} Sale`, data: results });
  } catch (error) {
    console.error('CalculateAllSalaries error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * POST /api/salaries/:id/bonus
 * Thêm thưởng khác cho Sale
 */
async function addBonus(req, res) {
  try {
    const { description, amount } = req.body;

    if (!description || !amount) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mô tả và số tiền' });
    }

    const salary = await prisma.salary.findUnique({ where: { id: req.params.id } });
    if (!salary) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bảng lương' });
    }

    const bonus = await prisma.salaryBonus.create({
      data: {
        salaryId: salary.id,
        userId: salary.userId,
        description: description.trim(),
        amount: parseFloat(amount),
      },
    });

    // Cập nhật tổng thưởng và tổng lương
    const allBonuses = await prisma.salaryBonus.findMany({ where: { salaryId: salary.id } });
    const newTotalBonus = allBonuses.reduce((sum, b) => sum + Number(b.amount), 0);
    const newTotalSalary = Number(salary.baseSalary) + Number(salary.commissionAmount) + newTotalBonus;

    await prisma.salary.update({
      where: { id: salary.id },
      data: { totalBonus: newTotalBonus, totalSalary: newTotalSalary },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'salary_bonuses',
      entityId: bonus.id,
      newData: { description, amount, salaryId: salary.id },
      description: `Thêm thưởng: ${description} — ${Number(amount).toLocaleString()}đ`,
    });

    res.status(201).json({ success: true, message: 'Thêm thưởng thành công', data: bonus });
  } catch (error) {
    console.error('AddBonus error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PUT /api/salaries/:id/status
 * Cập nhật trạng thái lương (DRAFT → CONFIRMED → PAID)
 */
async function updateSalaryStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['DRAFT', 'CONFIRMED', 'PAID'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const salary = await prisma.salary.findUnique({ where: { id: req.params.id } });
    if (!salary) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bảng lương' });
    }

    const updated = await prisma.salary.update({
      where: { id: req.params.id },
      data: { status },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'salaries',
      entityId: salary.id,
      oldData: { status: salary.status },
      newData: { status },
      description: `Đổi trạng thái lương → ${status}`,
    });

    res.json({ success: true, message: 'Cập nhật trạng thái thành công', data: updated });
  } catch (error) {
    console.error('UpdateSalaryStatus error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * GET /api/salaries/my-preview
 * Sale xem lương dự kiến realtime
 */
async function getMyPreview(req, res) {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const hoursAgg = await prisma.workingHours.aggregate({
      where: {
        month,
        year,
        worker: { saleId: req.user.id },
      },
      _sum: { totalHours: true },
    });

    const totalHours = Number(hoursAgg._sum.totalHours || 0);
    const calc = await calculateSalaryFromDB(totalHours, 0);

    // Lấy thưởng nếu đã có
    const existingSalary = await prisma.salary.findUnique({
      where: { userId_month_year: { userId: req.user.id, month, year } },
      include: { bonuses: true },
    });

    const bonuses = existingSalary?.bonuses || [];
    const totalBonus = bonuses.reduce((sum, b) => sum + Number(b.amount), 0);
    const finalCalc = await calculateSalaryFromDB(totalHours, totalBonus);

    res.json({
      success: true,
      data: {
        month,
        year,
        ...finalCalc,
        bonuses,
        status: existingSalary?.status || 'PREVIEW',
      },
    });
  } catch (error) {
    console.error('GetMyPreview error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * DELETE /api/salaries/:id
 */
async function deleteSalary(req, res) {
  try {
    const existing = await prisma.salary.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { fullName: true } } },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy bảng lương' });

    // Delete bonuses first, then salary
    await prisma.salaryBonus.deleteMany({ where: { salaryId: req.params.id } });
    await prisma.salary.delete({ where: { id: req.params.id } });

    await createAuditLog({
      userId: req.user.id, action: 'DELETE', entity: 'salaries', entityId: req.params.id,
      description: `Xóa bảng lương: ${existing.user.fullName} — T${existing.month}/${existing.year}`,
    });

    res.json({ success: true, message: 'Đã xóa bảng lương' });
  } catch (error) {
    console.error('DeleteSalary error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * GET /api/salaries/export
 * Export salary as CSV (can be opened in Excel)
 */
async function exportSalaries(req, res) {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ success: false, message: 'Thiếu tháng/năm' });

    const salaries = await prisma.salary.findMany({
      where: { month: parseInt(month), year: parseInt(year) },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        bonuses: true,
      },
      orderBy: { user: { fullName: 'asc' } },
    });

    // Build CSV with BOM for Excel UTF-8 support
    const BOM = '\uFEFF';
    const headers = ['STT', 'Họ tên', 'Email', 'SĐT', 'Tổng giờ', 'Mức HH/giờ', 'Lương CB', 'Hoa hồng', 'Thưởng khác', 'Tổng lương', 'Trạng thái'];
    const statusLabels = { DRAFT: 'Nháp', CONFIRMED: 'Xác nhận', PAID: 'Đã trả' };

    let csv = BOM + headers.join(',') + '\n';
    salaries.forEach((s, i) => {
      csv += [
        i + 1,
        `"${s.user.fullName}"`,
        s.user.email,
        s.user.phone || '',
        Number(s.totalHours),
        Number(s.commissionRate),
        Number(s.baseSalary),
        Number(s.commissionAmount),
        Number(s.totalBonus),
        Number(s.totalSalary),
        statusLabels[s.status] || s.status,
      ].join(',') + '\n';
    });

    // Total row
    const totalSalary = salaries.reduce((sum, s) => sum + Number(s.totalSalary), 0);
    const totalHours = salaries.reduce((sum, s) => sum + Number(s.totalHours), 0);
    csv += `,"TỔNG CỘNG",,,${totalHours},,,,,"${totalSalary}",\n`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="bang-luong-T${month}-${year}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('ExportSalaries error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

module.exports = { getSalaries, calculateAllSalaries, addBonus, updateSalaryStatus, getMyPreview, deleteSalary, exportSalaries };
