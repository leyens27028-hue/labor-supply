const express = require('express');
const router = express.Router();
const { getOrders, getOrderById, createOrder, updateOrder, assignWorker, removeWorker, deleteOrder, changeOrderStatus } = require('../controllers/recruitmentOrderController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), createOrder);
router.put('/:id', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), updateOrder);
router.delete('/:id', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), deleteOrder);
router.patch('/:id/status', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), changeOrderStatus);

// Gắn/gỡ CN vào đơn
router.post('/:id/assign-worker', authorize('ADMIN', 'TEAM_LEAD', 'SALE'), assignWorker);
router.delete('/:id/remove-worker/:assignmentId', authorize('ADMIN', 'TEAM_LEAD', 'SALE'), removeWorker);

module.exports = router;
