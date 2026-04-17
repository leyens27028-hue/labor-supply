const prisma = require('../config/prisma');
const { createAuditLog } = require('../utils/auditLog');

/**
 * GET /api/factories
 */
async function getFactories(req, res) {
  try {
    const { search, isActive, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [factories, total] = await Promise.all([
      prisma.factory.findMany({
        where,
        include: {
          vendors: {
            include: {
              vendor: { select: { id: true, name: true } },
            },
          },
          _count: { select: { workers: true, recruitmentOrders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.factory.count({ where }),
    ]);

    res.json({
      success: true,
      data: factories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('GetFactories error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * GET /api/factories/:id
 */
async function getFactoryById(req, res) {
  try {
    const factory = await prisma.factory.findUnique({
      where: { id: req.params.id },
      include: {
        vendors: {
          include: {
            vendor: { select: { id: true, name: true, contactPerson: true, phone: true } },
          },
        },
        _count: { select: { workers: true, recruitmentOrders: true } },
      },
    });

    if (!factory) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhà máy' });
    }

    res.json({ success: true, data: factory });
  } catch (error) {
    console.error('GetFactoryById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * POST /api/factories
 */
async function createFactory(req, res) {
  try {
    const { name, address, phone, note } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên nhà máy' });
    }

    const factory = await prisma.factory.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        note: note?.trim() || null,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'factories',
      entityId: factory.id,
      newData: { name: factory.name },
      description: `Tạo nhà máy: ${factory.name}`,
    });

    res.status(201).json({ success: true, message: 'Tạo nhà máy thành công', data: factory });
  } catch (error) {
    console.error('CreateFactory error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PUT /api/factories/:id
 */
async function updateFactory(req, res) {
  try {
    const { name, address, phone, note, isActive } = req.body;

    const existing = await prisma.factory.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhà máy' });
    }

    const oldData = { name: existing.name, address: existing.address, isActive: existing.isActive };
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (address !== undefined) data.address = address?.trim() || null;
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (note !== undefined) data.note = note?.trim() || null;
    if (isActive !== undefined) data.isActive = isActive;

    const factory = await prisma.factory.update({
      where: { id: req.params.id },
      data,
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'factories',
      entityId: factory.id,
      oldData,
      newData: data,
      description: `Cập nhật nhà máy: ${factory.name}`,
    });

    res.json({ success: true, message: 'Cập nhật thành công', data: factory });
  } catch (error) {
    console.error('UpdateFactory error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * DELETE /api/factories/:id (soft delete)
 */
async function deleteFactory(req, res) {
  try {
    const existing = await prisma.factory.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy nhà máy' });

    await prisma.factory.update({ where: { id: req.params.id }, data: { isActive: false } });

    await createAuditLog({
      userId: req.user.id, action: 'DELETE', entity: 'factories', entityId: req.params.id,
      description: `Vô hiệu nhà máy: ${existing.name}`,
    });

    res.json({ success: true, message: 'Đã vô hiệu nhà máy' });
  } catch (error) {
    console.error('DeleteFactory error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PATCH /api/factories/:id/toggle-active
 */
async function toggleFactoryActive(req, res) {
  try {
    const existing = await prisma.factory.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy nhà máy' });

    const factory = await prisma.factory.update({
      where: { id: req.params.id },
      data: { isActive: !existing.isActive },
    });

    await createAuditLog({
      userId: req.user.id, action: 'UPDATE', entity: 'factories', entityId: req.params.id,
      description: `${factory.isActive ? 'Kích hoạt' : 'Vô hiệu'} nhà máy: ${factory.name}`,
    });

    res.json({ success: true, message: factory.isActive ? 'Đã kích hoạt' : 'Đã vô hiệu', data: factory });
  } catch (error) {
    console.error('ToggleFactoryActive error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

module.exports = { getFactories, getFactoryById, createFactory, updateFactory, deleteFactory, toggleFactoryActive };
