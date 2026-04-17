const prisma = require('../config/prisma');
const { createAuditLog } = require('../utils/auditLog');

/**
 * GET /api/commission/tiers
 * Danh sách bậc hoa hồng
 */
async function getCommissionTiers(req, res) {
  try {
    const tiers = await prisma.commissionTier.findMany({
      orderBy: { minHours: 'asc' },
    });

    res.json({ success: true, data: tiers });
  } catch (error) {
    console.error('GetCommissionTiers error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * POST /api/commission/tiers
 * Tạo bậc hoa hồng mới
 */
async function createCommissionTier(req, res) {
  try {
    const { minHours, maxHours, rate, note } = req.body;

    if (minHours == null || maxHours == null || rate == null) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ minHours, maxHours, rate' });
    }

    if (parseInt(minHours) < 0 || parseInt(maxHours) < 0 || parseFloat(rate) < 0) {
      return res.status(400).json({ success: false, message: 'Giá trị không được âm' });
    }

    if (parseInt(minHours) > parseInt(maxHours)) {
      return res.status(400).json({ success: false, message: 'minHours phải nhỏ hơn hoặc bằng maxHours' });
    }

    const tier = await prisma.commissionTier.create({
      data: {
        minHours: parseInt(minHours),
        maxHours: parseInt(maxHours),
        rate: parseFloat(rate),
        note: note?.trim() || null,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'commission_tiers',
      entityId: tier.id,
      newData: { minHours: tier.minHours, maxHours: tier.maxHours, rate: Number(tier.rate) },
      description: `Tạo bậc hoa hồng: ${tier.minHours}–${tier.maxHours}h, ${Number(tier.rate).toLocaleString()}đ/giờ`,
    });

    res.status(201).json({ success: true, message: 'Tạo bậc hoa hồng thành công', data: tier });
  } catch (error) {
    console.error('CreateCommissionTier error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PUT /api/commission/tiers/:id
 * Cập nhật bậc hoa hồng
 */
async function updateCommissionTier(req, res) {
  try {
    const existing = await prisma.commissionTier.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bậc hoa hồng' });
    }

    const { minHours, maxHours, rate, note } = req.body;
    const data = {};

    if (minHours != null) data.minHours = parseInt(minHours);
    if (maxHours != null) data.maxHours = parseInt(maxHours);
    if (rate != null) data.rate = parseFloat(rate);
    if (note !== undefined) data.note = note?.trim() || null;

    const finalMin = data.minHours ?? existing.minHours;
    const finalMax = data.maxHours ?? existing.maxHours;

    if (finalMin > finalMax) {
      return res.status(400).json({ success: false, message: 'minHours phải nhỏ hơn hoặc bằng maxHours' });
    }

    const updated = await prisma.commissionTier.update({
      where: { id: req.params.id },
      data,
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'commission_tiers',
      entityId: req.params.id,
      oldData: { minHours: existing.minHours, maxHours: existing.maxHours, rate: Number(existing.rate) },
      newData: { minHours: updated.minHours, maxHours: updated.maxHours, rate: Number(updated.rate) },
      description: `Cập nhật bậc hoa hồng: ${updated.minHours}–${updated.maxHours}h, ${Number(updated.rate).toLocaleString()}đ/giờ`,
    });

    res.json({ success: true, message: 'Cập nhật bậc hoa hồng thành công', data: updated });
  } catch (error) {
    console.error('UpdateCommissionTier error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * DELETE /api/commission/tiers/:id
 * Xóa bậc hoa hồng
 */
async function deleteCommissionTier(req, res) {
  try {
    const existing = await prisma.commissionTier.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bậc hoa hồng' });
    }

    await prisma.commissionTier.delete({ where: { id: req.params.id } });

    await createAuditLog({
      userId: req.user.id,
      action: 'DELETE',
      entity: 'commission_tiers',
      entityId: req.params.id,
      oldData: { minHours: existing.minHours, maxHours: existing.maxHours, rate: Number(existing.rate) },
      description: `Xóa bậc hoa hồng: ${existing.minHours}–${existing.maxHours}h`,
    });

    res.json({ success: true, message: 'Đã xóa bậc hoa hồng' });
  } catch (error) {
    console.error('DeleteCommissionTier error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PATCH /api/commission/tiers/:id/toggle-active
 * Bật/tắt trạng thái bậc hoa hồng
 */
async function toggleCommissionTierActive(req, res) {
  try {
    const existing = await prisma.commissionTier.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bậc hoa hồng' });
    }

    const updated = await prisma.commissionTier.update({
      where: { id: req.params.id },
      data: { isActive: !existing.isActive },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'commission_tiers',
      entityId: req.params.id,
      oldData: { isActive: existing.isActive },
      newData: { isActive: updated.isActive },
      description: `${updated.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} bậc hoa hồng: ${existing.minHours}–${existing.maxHours}h`,
    });

    res.json({ success: true, message: updated.isActive ? 'Đã kích hoạt' : 'Đã vô hiệu hóa', data: updated });
  } catch (error) {
    console.error('ToggleCommissionTierActive error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * GET /api/commission/configs
 * Danh sách cấu hình lương
 */
async function getSalaryConfigs(req, res) {
  try {
    const configs = await prisma.salaryConfig.findMany({
      orderBy: { key: 'asc' },
    });

    res.json({ success: true, data: configs });
  } catch (error) {
    console.error('GetSalaryConfigs error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PUT /api/commission/configs/:key
 * Cập nhật (upsert) cấu hình lương
 */
async function updateSalaryConfig(req, res) {
  try {
    const { key } = req.params;
    const { value, note } = req.body;

    if (value == null) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập value' });
    }

    const existing = await prisma.salaryConfig.findUnique({ where: { key } });

    const config = await prisma.salaryConfig.upsert({
      where: { key },
      update: {
        value: String(value),
        note: note !== undefined ? (note?.trim() || null) : undefined,
      },
      create: {
        key,
        value: String(value),
        note: note?.trim() || null,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: existing ? 'UPDATE' : 'CREATE',
      entity: 'salary_configs',
      entityId: config.id,
      oldData: existing ? { key, value: existing.value } : null,
      newData: { key, value: String(value) },
      description: `Cập nhật cấu hình lương: ${key} = ${value}`,
    });

    res.json({ success: true, message: 'Cập nhật cấu hình thành công', data: config });
  } catch (error) {
    console.error('UpdateSalaryConfig error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

module.exports = {
  getCommissionTiers,
  createCommissionTier,
  updateCommissionTier,
  deleteCommissionTier,
  toggleCommissionTierActive,
  getSalaryConfigs,
  updateSalaryConfig,
};
