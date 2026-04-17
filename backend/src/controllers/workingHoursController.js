const prisma = require('../config/prisma');
const { createAuditLog } = require('../utils/auditLog');

/**
 * GET /api/working-hours
 * Lấy danh sách giờ làm theo tháng
 */
async function getWorkingHours(req, res) {
  try {
    const { month, year, saleId, workerId, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (workerId) where.workerId = workerId;

    // Sale chỉ xem giờ CN mình phụ trách
    if (req.user.role === 'SALE') {
      where.worker = { saleId: req.user.id };
    } else if (saleId) {
      where.worker = { saleId };
    }

    // Trưởng nhóm xem CN trong nhóm
    if (req.user.role === 'TEAM_LEAD') {
      const team = await prisma.team.findUnique({ where: { leadId: req.user.id }, include: { members: { select: { id: true } } } });
      if (team) {
        const memberIds = team.members.map((m) => m.id);
        memberIds.push(req.user.id);
        where.worker = { saleId: { in: memberIds } };
      }
    }

    const [records, total] = await Promise.all([
      prisma.workingHours.findMany({
        where,
        include: {
          worker: {
            select: { id: true, fullName: true, idCard: true, factory: { select: { name: true } }, sale: { select: { id: true, fullName: true } } },
          },
          enteredBy: { select: { fullName: true } },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip,
        take: parseInt(limit),
      }),
      prisma.workingHours.count({ where }),
    ]);

    res.json({
      success: true,
      data: records,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('GetWorkingHours error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * POST /api/working-hours
 * Nhập giờ làm (đơn lẻ hoặc batch)
 */
async function createWorkingHours(req, res) {
  try {
    const { workerId, month, year, totalHours, note } = req.body;

    if (!workerId || !month || !year || totalHours === undefined) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ: CN, tháng, năm, tổng giờ' });
    }

    // Upsert: nếu đã có record thì cập nhật
    const record = await prisma.workingHours.upsert({
      where: { workerId_month_year: { workerId, month: parseInt(month), year: parseInt(year) } },
      update: {
        totalHours: parseFloat(totalHours),
        enteredById: req.user.id,
        enteredAt: new Date(),
        note: note?.trim() || null,
      },
      create: {
        workerId,
        month: parseInt(month),
        year: parseInt(year),
        totalHours: parseFloat(totalHours),
        enteredById: req.user.id,
        note: note?.trim() || null,
      },
      include: {
        worker: { select: { fullName: true } },
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'working_hours',
      entityId: record.id,
      newData: { workerId, month, year, totalHours },
      description: `Nhập giờ: ${record.worker.fullName} — T${month}/${year}: ${totalHours}h`,
    });

    res.status(201).json({ success: true, message: 'Nhập giờ thành công', data: record });
  } catch (error) {
    console.error('CreateWorkingHours error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * POST /api/working-hours/batch
 * Nhập giờ hàng loạt
 */
async function batchCreateWorkingHours(req, res) {
  try {
    const { records } = req.body; // [{ workerId, month, year, totalHours, note }]

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách giờ làm trống' });
    }

    const results = [];
    for (const r of records) {
      const record = await prisma.workingHours.upsert({
        where: { workerId_month_year: { workerId: r.workerId, month: parseInt(r.month), year: parseInt(r.year) } },
        update: {
          totalHours: parseFloat(r.totalHours),
          enteredById: req.user.id,
          enteredAt: new Date(),
          note: r.note?.trim() || null,
        },
        create: {
          workerId: r.workerId,
          month: parseInt(r.month),
          year: parseInt(r.year),
          totalHours: parseFloat(r.totalHours),
          enteredById: req.user.id,
          note: r.note?.trim() || null,
        },
      });
      results.push(record);
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'working_hours',
      entityId: 'batch',
      newData: { count: results.length },
      description: `Nhập giờ hàng loạt: ${results.length} bản ghi`,
    });

    res.status(201).json({ success: true, message: `Đã nhập ${results.length} bản ghi`, data: results });
  } catch (error) {
    console.error('BatchCreateWorkingHours error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PUT /api/working-hours/:id
 */
async function updateWorkingHours(req, res) {
  try {
    const existing = await prisma.workingHours.findUnique({
      where: { id: req.params.id },
      include: { worker: { select: { fullName: true } } },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi' });

    const { totalHours, note } = req.body;
    const data = { enteredById: req.user.id, enteredAt: new Date() };
    if (totalHours !== undefined) data.totalHours = parseFloat(totalHours);
    if (note !== undefined) data.note = note?.trim() || null;

    const record = await prisma.workingHours.update({ where: { id: req.params.id }, data });

    await createAuditLog({
      userId: req.user.id, action: 'UPDATE', entity: 'working_hours', entityId: record.id,
      oldData: { totalHours: existing.totalHours },
      newData: { totalHours: record.totalHours },
      description: `Sửa giờ: ${existing.worker.fullName} — ${Number(existing.totalHours)}h → ${Number(record.totalHours)}h`,
    });

    res.json({ success: true, message: 'Cập nhật thành công', data: record });
  } catch (error) {
    console.error('UpdateWorkingHours error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * DELETE /api/working-hours/:id
 */
async function deleteWorkingHours(req, res) {
  try {
    const existing = await prisma.workingHours.findUnique({
      where: { id: req.params.id },
      include: { worker: { select: { fullName: true } } },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi' });

    await prisma.workingHours.delete({ where: { id: req.params.id } });

    await createAuditLog({
      userId: req.user.id, action: 'DELETE', entity: 'working_hours', entityId: req.params.id,
      oldData: { workerId: existing.workerId, totalHours: existing.totalHours, month: existing.month, year: existing.year },
      description: `Xóa giờ: ${existing.worker.fullName} — T${existing.month}/${existing.year}: ${Number(existing.totalHours)}h`,
    });

    res.json({ success: true, message: 'Đã xóa bản ghi giờ làm' });
  } catch (error) {
    console.error('DeleteWorkingHours error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

module.exports = { getWorkingHours, createWorkingHours, batchCreateWorkingHours, updateWorkingHours, deleteWorkingHours };
