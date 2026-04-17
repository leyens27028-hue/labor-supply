const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, resetPassword } = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/auth');

// Tất cả route đều cần đăng nhập
router.use(authenticate);

// Danh sách user (Admin + Director + Team Lead)
router.get('/', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), getUsers);

// Chi tiết user
router.get('/:id', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), getUserById);

// Tạo user (Admin only)
router.post('/', authorize('ADMIN'), createUser);

// Cập nhật user (Admin only)
router.put('/:id', authorize('ADMIN'), updateUser);

// Reset mật khẩu (Admin only)
router.put('/:id/reset-password', authorize('ADMIN'), resetPassword);

module.exports = router;
