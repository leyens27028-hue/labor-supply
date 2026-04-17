const express = require('express');
const router = express.Router();
const {
  getCommissionTiers,
  createCommissionTier,
  updateCommissionTier,
  deleteCommissionTier,
  toggleCommissionTierActive,
  getSalaryConfigs,
  updateSalaryConfig,
} = require('../controllers/commissionController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Bậc hoa hồng
router.get('/tiers', getCommissionTiers);
router.post('/tiers', authorize('ADMIN'), createCommissionTier);
router.put('/tiers/:id', authorize('ADMIN'), updateCommissionTier);
router.delete('/tiers/:id', authorize('ADMIN'), deleteCommissionTier);
router.patch('/tiers/:id/toggle-active', authorize('ADMIN'), toggleCommissionTierActive);

// Cấu hình lương
router.get('/configs', getSalaryConfigs);
router.put('/configs/:key', authorize('ADMIN'), updateSalaryConfig);

module.exports = router;
