const prisma = require('../config/prisma');
const { createAuditLog } = require('../utils/auditLog');

/**
 * GET /api/vendors
 */
async function getVendors(req, res) {
  try {
    const { search, isActive, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          factories: {
            include: {
              factory: { select: { id: true, name: true, address: true } },
            },
          },
          _count: { select: { recruitmentOrders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.vendor.count({ where }),
    ]);

    res.json({
      success: true,
      data: vendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('GetVendors error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * GET /api/vendors/:id
 */
async function getVendorById(req, res) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        factories: {
          include: {
            factory: { select: { id: true, name: true, address: true, phone: true } },
          },
        },
        recruitmentOrders: {
          select: {
            id: true,
            title: true,
            status: true,
            employmentType: true,
            quantity: true,
            createdAt: true,
            factory: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { recruitmentOrders: true } },
      },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Vendor' });
    }

    res.json({ success: true, data: vendor });
  } catch (error) {
    console.error('GetVendorById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * POST /api/vendors
 */
async function createVendor(req, res) {
  try {
    const { name, contactPerson, phone, email, address, note } = req.body;

    if (!name || !contactPerson || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập: tên Vendor, người liên hệ, số điện thoại',
      });
    }

    const vendor = await prisma.vendor.create({
      data: {
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        address: address?.trim() || null,
        note: note?.trim() || null,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'vendors',
      entityId: vendor.id,
      newData: { name: vendor.name, contactPerson: vendor.contactPerson },
      description: `Tạo Vendor: ${vendor.name}`,
    });

    res.status(201).json({ success: true, message: 'Tạo Vendor thành công', data: vendor });
  } catch (error) {
    console.error('CreateVendor error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PUT /api/vendors/:id
 */
async function updateVendor(req, res) {
  try {
    const { name, contactPerson, phone, email, address, note, isActive } = req.body;

    const existing = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Vendor' });
    }

    const oldData = { name: existing.name, contactPerson: existing.contactPerson, phone: existing.phone, isActive: existing.isActive };

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (contactPerson !== undefined) data.contactPerson = contactPerson.trim();
    if (phone !== undefined) data.phone = phone.trim();
    if (email !== undefined) data.email = email?.trim() || null;
    if (address !== undefined) data.address = address?.trim() || null;
    if (note !== undefined) data.note = note?.trim() || null;
    if (isActive !== undefined) data.isActive = isActive;

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data,
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'vendors',
      entityId: vendor.id,
      oldData,
      newData: data,
      description: `Cập nhật Vendor: ${vendor.name}`,
    });

    res.json({ success: true, message: 'Cập nhật thành công', data: vendor });
  } catch (error) {
    console.error('UpdateVendor error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * POST /api/vendors/:id/factories
 * Liên kết Vendor với Nhà máy (kèm loại hình)
 */
async function addFactory(req, res) {
  try {
    const { factoryId, employmentType } = req.body;

    if (!factoryId || !employmentType) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn nhà máy và loại hình (SEASONAL/PERMANENT)',
      });
    }

    if (!['SEASONAL', 'PERMANENT'].includes(employmentType)) {
      return res.status(400).json({ success: false, message: 'Loại hình không hợp lệ' });
    }

    // Kiểm tra đã liên kết chưa
    const existing = await prisma.vendorFactory.findUnique({
      where: {
        vendorId_factoryId_employmentType: {
          vendorId: req.params.id,
          factoryId,
          employmentType,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Liên kết này đã tồn tại' });
    }

    const link = await prisma.vendorFactory.create({
      data: {
        vendorId: req.params.id,
        factoryId,
        employmentType,
      },
      include: {
        factory: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'vendor_factories',
      entityId: link.id,
      newData: { vendorId: req.params.id, factoryId, employmentType },
      description: `Liên kết ${link.vendor.name} ↔ ${link.factory.name} (${employmentType})`,
    });

    res.status(201).json({ success: true, message: 'Liên kết thành công', data: link });
  } catch (error) {
    console.error('AddFactory error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * DELETE /api/vendors/:id/factories/:linkId
 * Xóa liên kết Vendor ↔ Nhà máy
 */
async function removeFactory(req, res) {
  try {
    const link = await prisma.vendorFactory.findUnique({
      where: { id: req.params.linkId },
      include: {
        factory: { select: { name: true } },
        vendor: { select: { name: true } },
      },
    });

    if (!link) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy liên kết' });
    }

    await prisma.vendorFactory.delete({ where: { id: req.params.linkId } });

    await createAuditLog({
      userId: req.user.id,
      action: 'DELETE',
      entity: 'vendor_factories',
      entityId: req.params.linkId,
      oldData: { vendorId: link.vendorId, factoryId: link.factoryId, employmentType: link.employmentType },
      description: `Xóa liên kết ${link.vendor.name} ↔ ${link.factory.name}`,
    });

    res.json({ success: true, message: 'Đã xóa liên kết' });
  } catch (error) {
    console.error('RemoveFactory error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

module.exports = { getVendors, getVendorById, createVendor, updateVendor, addFactory, removeFactory };
