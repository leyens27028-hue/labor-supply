const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

// Thống kê tổng quan
router.get('/stats', getStats);

module.exports = router;
