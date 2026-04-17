const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { createAuditLog } = require('../utils/auditLog');

/**
 * GET /api/users
 * Danh sách user (Admin: tất cả, Trưởng nhóm: chỉ Sale trong nhóm)
 */
async function getUsers(req, res) {
  try {
    const { role, teamId, isActive, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    // Trưởng nhóm chỉ xem Sale trong nhóm mình
    if (req.user.role === 'TEAM_LEAD') {
      const team = await prisma.team.findUnique({ where: { leadId: req.user.id } });
      if (team) {
        where.teamId = team.id;
        where.role = 'SALE';
      }
    }

    // Filter
    if (role) where.role = role;
    if (teamId) where.teamId = teamId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
          teamId: true,
          createdAt: true,
          team: { select: { id: true, name: true } },
          leadOfTeam: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('GetUsers error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * GET /api/users/:id
 * Chi tiết user
 */
async function getUserById(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        teamId: true,
        createdAt: true,
        updatedAt: true,
        team: { select: { id: true, name: true } },
        leadOfTeam: { select: { id: true, name: true } },
        _count: { select: { workers: true, assignedOrders: true, collaborators: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('GetUserById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * POST /api/users
 * Tạo user mới (Admin only)
 */
async function createUser(req, res) {
  try {
    const { email, password, fullName, phone, role, teamId } = req.body;

    // Validate
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đủ: email, mật khẩu, họ tên, vai trò',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const validRoles = ['ADMIN', 'DIRECTOR', 'TEAM_LEAD', 'SALE'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ' });
    }

    // Kiểm tra email trùng
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại trong hệ thống' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        fullName: fullName.trim(),
        phone: phone || null,
        role,
        teamId: teamId || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        teamId: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'users',
      entityId: user.id,
      newData: { email: user.email, fullName: user.fullName, role: user.role },
      description: `Tạo tài khoản: ${user.fullName} (${user.role})`,
    });

    res.status(201).json({ success: true, message: 'Tạo tài khoản thành công', data: user });
  } catch (error) {
    console.error('CreateUser error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PUT /api/users/:id
 * Cập nhật user (Admin only)
 */
async function updateUser(req, res) {
  try {
    const { fullName, phone, role, teamId, isActive } = req.body;

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
    }

    const oldData = { fullName: existing.fullName, phone: existing.phone, role: existing.role, teamId: existing.teamId, isActive: existing.isActive };

    const data = {};
    if (fullName !== undefined) data.fullName = fullName.trim();
    if (phone !== undefined) data.phone = phone || null;
    if (role !== undefined) {
      const validRoles = ['ADMIN', 'DIRECTOR', 'TEAM_LEAD', 'SALE'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ' });
      }
      data.role = role;
    }
    if (teamId !== undefined) data.teamId = teamId || null;
    if (isActive !== undefined) data.isActive = isActive;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        teamId: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'users',
      entityId: user.id,
      oldData,
      newData: data,
      description: `Cập nhật tài khoản: ${user.fullName}`,
    });

    res.json({ success: true, message: 'Cập nhật thành công', data: user });
  } catch (error) {
    console.error('UpdateUser error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PUT /api/users/:id/reset-password
 * Reset mật khẩu (Admin only)
 */
async function resetPassword(req, res) {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashedPassword },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'users',
      entityId: req.params.id,
      description: `Admin reset mật khẩu cho: ${existing.fullName}`,
    });

    res.json({ success: true, message: `Đã reset mật khẩu cho ${existing.fullName}` });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

module.exports = { getUsers, getUserById, createUser, updateUser, resetPassword };
