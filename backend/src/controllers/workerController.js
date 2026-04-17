const prisma = require('../config/prisma');
const { createAuditLog } = require('../utils/auditLog');

/**
 * GET /api/workers
 */
async function getWorkers(req, res) {
  try {
    const { search, status, employmentType, saleId, factoryId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    // Sale chỉ xem CN mình phụ trách
    if (req.user.role === 'SALE') {
      where.saleId = req.user.id;
    }

    // Trưởng nhóm xem CN của Sale trong nhóm
    if (req.user.role === 'TEAM_LEAD') {
      const team = await prisma.team.findUnique({ where: { leadId: req.user.id }, include: { members: { select: { id: true } } } });
      if (team) {
        const memberIds = team.members.map((m) => m.id);
        memberIds.push(req.user.id);
        where.saleId = { in: memberIds };
      }
    }

    if (status) where.status = status;
    if (employmentType) where.employmentType = employmentType;
    if (saleId) where.saleId = saleId;
    if (factoryId) where.factoryId = factoryId;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { idCard: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [workers, total] = await Promise.all([
      prisma.worker.findMany({
        where,
        include: {
          factory: { select: { id: true, name: true } },
          sale: { select: { id: true, fullName: true } },
          collaborator: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.worker.count({ where }),
    ]);

    res.json({
      success: true,
      data: workers,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('GetWorkers error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * GET /api/workers/:id
 */
async function getWorkerById(req, res) {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: req.params.id },
      include: {
        factory: { select: { id: true, name: true, address: true } },
        sale: { select: { id: true, fullName: true, email: true } },
        collaborator: { select: { id: true, fullName: true, phone: true } },
        assignments: {
          include: {
            recruitmentOrder: {
              select: { id: true, title: true, status: true, factory: { select: { name: true } } },
            },
          },
          orderBy: { assignedDate: 'desc' },
        },
        workingHours: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 12,
        },
      },
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công nhân' });
    }

    res.json({ success: true, data: worker });
  } catch (error) {
    console.error('GetWorkerById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * POST /api/workers
 */
async function createWorker(req, res) {
  try {
    const { fullName, idCard, phone, address, gender, dateOfBirth, employmentType, saleId, collaboratorId, note } = req.body;

    if (!fullName || !idCard) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập: họ tên, số CCCD' });
    }

    const existingId = await prisma.worker.findUnique({ where: { idCard: idCard.trim() } });
    if (existingId) {
      return res.status(400).json({ success: false, message: 'Số CCCD đã tồn tại trong hệ thống' });
    }

    const worker = await prisma.worker.create({
      data: {
        fullName: fullName.trim(),
        idCard: idCard.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        gender: gender || 'ANY',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        employmentType: employmentType || null,
        saleId: saleId || (req.user.role === 'SALE' ? req.user.id : null),
        collaboratorId: collaboratorId || null,
        note: note?.trim() || null,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'workers',
      entityId: worker.id,
      newData: { fullName: worker.fullName, idCard: worker.idCard },
      description: `Tạo công nhân: ${worker.fullName}`,
    });

    res.status(201).json({ success: true, message: 'Tạo công nhân thành công', data: worker });
  } catch (error) {
    console.error('CreateWorker error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PUT /api/workers/:id
 */
async function updateWorker(req, res) {
  try {
    const existing = await prisma.worker.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công nhân' });
    }

    const { fullName, phone, address, gender, dateOfBirth, employmentType, status, factoryId, startDate, saleId, collaboratorId, note } = req.body;

    const oldData = { fullName: existing.fullName, status: existing.status, factoryId: existing.factoryId, saleId: existing.saleId };
    const data = {};
    if (fullName !== undefined) data.fullName = fullName.trim();
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (address !== undefined) data.address = address?.trim() || null;
    if (gender !== undefined) data.gender = gender;
    if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (employmentType !== undefined) data.employmentType = employmentType || null;
    if (status !== undefined) data.status = status;
    if (factoryId !== undefined) data.factoryId = factoryId || null;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (saleId !== undefined) data.saleId = saleId || null;
    if (collaboratorId !== undefined) data.collaboratorId = collaboratorId || null;
    if (note !== undefined) data.note = note?.trim() || null;

    const worker = await prisma.worker.update({ where: { id: req.params.id }, data });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'workers',
      entityId: worker.id,
      oldData,
      newData: data,
      description: `Cập nhật công nhân: ${worker.fullName}`,
    });

    res.json({ success: true, message: 'Cập nhật thành công', data: worker });
  } catch (error) {
    console.error('UpdateWorker error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * DELETE /api/workers/:id — soft delete (set status to RESIGNED)
 */
async function deleteWorker(req, res) {
  try {
    const existing = await prisma.worker.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công nhân' });
    }

    const worker = await prisma.worker.update({
      where: { id: req.params.id },
      data: { status: 'RESIGNED', factoryId: null, startDate: null },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'DELETE',
      entity: 'workers',
      entityId: worker.id,
      oldData: { status: existing.status, factoryId: existing.factoryId },
      newData: { status: 'RESIGNED' },
      description: `Xóa (vô hiệu) công nhân: ${worker.fullName}`,
    });

    res.json({ success: true, message: 'Đã vô hiệu công nhân', data: worker });
  } catch (error) {
    console.error('DeleteWorker error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PATCH /api/workers/:id/toggle-active — toggle between AVAILABLE and RESIGNED
 */
async function toggleActiveWorker(req, res) {
  try {
    const existing = await prisma.worker.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công nhân' });
    }

    const newStatus = existing.status === 'RESIGNED' ? 'AVAILABLE' : 'RESIGNED';
    const data = { status: newStatus };
    // If deactivating, also clear factory assignment
    if (newStatus === 'RESIGNED') {
      data.factoryId = null;
      data.startDate = null;
    }

    const worker = await prisma.worker.update({ where: { id: req.params.id }, data });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'workers',
      entityId: worker.id,
      oldData: { status: existing.status },
      newData: { status: newStatus },
      description: `${newStatus === 'RESIGNED' ? 'Vô hiệu' : 'Kích hoạt'} công nhân: ${worker.fullName}`,
    });

    res.json({ success: true, message: newStatus === 'RESIGNED' ? 'Đã vô hiệu' : 'Đã kích hoạt', data: worker });
  } catch (error) {
    console.error('ToggleActiveWorker error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

module.exports = { getWorkers, getWorkerById, createWorker, updateWorker, deleteWorker, toggleActiveWorker };
