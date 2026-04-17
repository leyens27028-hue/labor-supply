const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/prisma');

/**
 * Middleware xác thực JWT
 * Gắn req.user = { id, email, role, fullName }
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, fullName: true, isActive: true, teamId: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Tài khoản không hợp lệ hoặc đã bị vô hiệu hóa' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn' });
    }
    return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  }
}

/**
 * Middleware phân quyền theo role
 * @param  {...string} roles - Danh sách role được phép truy cập
 * @example authorize('ADMIN', 'DIRECTOR')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền truy cập. Yêu cầu: ${roles.join(' hoặc ')}`,
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
