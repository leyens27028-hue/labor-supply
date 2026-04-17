const express = require('express');
const router = express.Router();
const { getVendors, getVendorById, createVendor, updateVendor, addFactory, removeFactory } = require('../controllers/vendorController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// CRUD Vendor
router.get('/', getVendors);
router.get('/:id', getVendorById);
router.post('/', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), createVendor);
router.put('/:id', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), updateVendor);

// Liên kết Vendor ↔ Nhà máy
router.post('/:id/factories', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), addFactory);
router.delete('/:id/factories/:linkId', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), removeFactory);

module.exports = router;
