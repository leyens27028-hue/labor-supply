const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/prisma');
const { createAuditLog } = require('../utils/auditLog');

/**
 * POST /api/auth/login
 * Đăng nhập bằng email + mật khẩu
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        team: { select: { id: true, name: true } },
        leadOfTeam: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    const { password: _, ...userData } = user;

    await createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      entity: 'users',
      entityId: user.id,
      description: `${user.fullName} đã đăng nhập`,
    });

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: { user: userData, token },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * GET /api/auth/me
 * Lấy thông tin user hiện tại
 */
async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PUT /api/auth/change-password
 * Đổi mật khẩu
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ mật khẩu cũ và mới' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'users',
      entityId: req.user.id,
      description: `${req.user.fullName} đã đổi mật khẩu`,
    });

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('ChangePassword error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

module.exports = { login, getMe, changePassword };
