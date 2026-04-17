const express = require('express');
const router = express.Router();
const { getWorkers, getWorkerById, createWorker, updateWorker, deleteWorker, toggleActiveWorker } = require('../controllers/workerController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', getWorkers);
router.get('/:id', getWorkerById);
router.post('/', authorize('ADMIN', 'TEAM_LEAD', 'SALE'), createWorker);
router.put('/:id', authorize('ADMIN', 'TEAM_LEAD', 'SALE'), updateWorker);
router.delete('/:id', authorize('ADMIN', 'TEAM_LEAD'), deleteWorker);
router.patch('/:id/toggle-active', authorize('ADMIN', 'TEAM_LEAD'), toggleActiveWorker);

module.exports = router;
