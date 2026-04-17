const prisma = require('../config/prisma');
const { createAuditLog } = require('../utils/auditLog');

/**
 * GET /api/collaborators
 */
async function getCollaborators(req, res) {
  try {
    const { search, saleId, isActive, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    // Sale chỉ xem CTV mình quản lý
    if (req.user.role === 'SALE') {
      where.saleId = req.user.id;
    }

    if (req.user.role === 'TEAM_LEAD') {
      const team = await prisma.team.findUnique({ where: { leadId: req.user.id }, include: { members: { select: { id: true } } } });
      if (team) {
        const memberIds = team.members.map((m) => m.id);
        memberIds.push(req.user.id);
        where.saleId = { in: memberIds };
      }
    }

    if (saleId) where.saleId = saleId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { idCard: { contains: search } },
      ];
    }

    const [collaborators, total] = await Promise.all([
      prisma.collaborator.findMany({
        where,
        include: {
          sale: { select: { id: true, fullName: true } },
          _count: { select: { workers: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.collaborator.count({ where }),
    ]);

    res.json({
      success: true,
      data: collaborators,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('GetCollaborators error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * POST /api/collaborators
 */
async function createCollaborator(req, res) {
  try {
    const { fullName, phone, idCard, address, bankAccount, bankName, saleId, note } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập: họ tên, số điện thoại' });
    }

    if (idCard) {
      const existing = await prisma.collaborator.findUnique({ where: { idCard: idCard.trim() } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Số CCCD đã tồn tại' });
      }
    }

    const collaborator = await prisma.collaborator.create({
      data: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        idCard: idCard?.trim() || null,
        address: address?.trim() || null,
        bankAccount: bankAccount?.trim() || null,
        bankName: bankName?.trim() || null,
        saleId: saleId || (req.user.role === 'SALE' ? req.user.id : null),
        note: note?.trim() || null,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'collaborators',
      entityId: collaborator.id,
      newData: { fullName: collaborator.fullName, phone: collaborator.phone },
      description: `Tạo CTV: ${collaborator.fullName}`,
    });

    res.status(201).json({ success: true, message: 'Tạo CTV thành công', data: collaborator });
  } catch (error) {
    console.error('CreateCollaborator error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PUT /api/collaborators/:id
 */
async function updateCollaborator(req, res) {
  try {
    const existing = await prisma.collaborator.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy CTV' });
    }

    const { fullName, phone, address, bankAccount, bankName, saleId, isActive, note } = req.body;
    const data = {};
    if (fullName !== undefined) data.fullName = fullName.trim();
    if (phone !== undefined) data.phone = phone.trim();
    if (address !== undefined) data.address = address?.trim() || null;
    if (bankAccount !== undefined) data.bankAccount = bankAccount?.trim() || null;
    if (bankName !== undefined) data.bankName = bankName?.trim() || null;
    if (saleId !== undefined) data.saleId = saleId || null;
    if (isActive !== undefined) data.isActive = isActive;
    if (note !== undefined) data.note = note?.trim() || null;

    const collaborator = await prisma.collaborator.update({ where: { id: req.params.id }, data });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'collaborators',
      entityId: collaborator.id,
      oldData: { fullName: existing.fullName, saleId: existing.saleId, isActive: existing.isActive },
      newData: data,
      description: `Cập nhật CTV: ${collaborator.fullName}`,
    });

    res.json({ success: true, message: 'Cập nhật thành công', data: collaborator });
  } catch (error) {
    console.error('UpdateCollaborator error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * GET /api/collaborators/:id
 */
async function getCollaboratorById(req, res) {
  try {
    const collaborator = await prisma.collaborator.findUnique({
      where: { id: req.params.id },
      include: {
        sale: { select: { id: true, fullName: true, email: true } },
        workers: {
          select: { id: true, fullName: true, idCard: true, phone: true, status: true, factory: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!collaborator) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy CTV' });
    }

    res.json({ success: true, data: collaborator });
  } catch (error) {
    console.error('GetCollaboratorById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * DELETE /api/collaborators/:id (soft delete)
 */
async function deleteCollaborator(req, res) {
  try {
    const existing = await prisma.collaborator.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy CTV' });

    await prisma.collaborator.update({ where: { id: req.params.id }, data: { isActive: false } });

    await createAuditLog({
      userId: req.user.id, action: 'DELETE', entity: 'collaborators', entityId: req.params.id,
      description: `Vô hiệu CTV: ${existing.fullName}`,
    });

    res.json({ success: true, message: 'Đã vô hiệu CTV' });
  } catch (error) {
    console.error('DeleteCollaborator error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PATCH /api/collaborators/:id/toggle-active
 */
async function toggleCollaboratorActive(req, res) {
  try {
    const existing = await prisma.collaborator.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy CTV' });

    const collaborator = await prisma.collaborator.update({
      where: { id: req.params.id },
      data: { isActive: !existing.isActive },
    });

    await createAuditLog({
      userId: req.user.id, action: 'UPDATE', entity: 'collaborators', entityId: req.params.id,
      description: `${collaborator.isActive ? 'Kích hoạt' : 'Vô hiệu'} CTV: ${collaborator.fullName}`,
    });

    res.json({ success: true, message: collaborator.isActive ? 'Đã kích hoạt' : 'Đã vô hiệu', data: collaborator });
  } catch (error) {
    console.error('ToggleCollaboratorActive error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

module.exports = { getCollaborators, getCollaboratorById, createCollaborator, updateCollaborator, deleteCollaborator, toggleCollaboratorActive };
