const express = require('express');
const router = express.Router();
const { getSalaries, calculateAllSalaries, addBonus, updateSalaryStatus, getMyPreview, deleteSalary, exportSalaries } = require('../controllers/salaryController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Sale xem lương dự kiến
router.get('/my-preview', getMyPreview);

// Export CSV
router.get('/export', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), exportSalaries);

// Danh sách bảng lương
router.get('/', getSalaries);

// Tính lương toàn bộ Sale
router.post('/calculate', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), calculateAllSalaries);

// Thêm thưởng
router.post('/:id/bonus', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), addBonus);

// Cập nhật trạng thái
router.put('/:id/status', authorize('ADMIN', 'DIRECTOR'), updateSalaryStatus);

// Xóa bảng lương
router.delete('/:id', authorize('ADMIN', 'DIRECTOR'), deleteSalary);

module.exports = router;
