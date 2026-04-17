const express = require('express');
const router = express.Router();
const { getWorkingHours, createWorkingHours, batchCreateWorkingHours, updateWorkingHours, deleteWorkingHours } = require('../controllers/workingHoursController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', getWorkingHours);
router.post('/', authorize('ADMIN', 'TEAM_LEAD', 'SALE'), createWorkingHours);
router.post('/batch', authorize('ADMIN', 'TEAM_LEAD', 'SALE'), batchCreateWorkingHours);
router.put('/:id', authorize('ADMIN', 'TEAM_LEAD'), updateWorkingHours);
router.delete('/:id', authorize('ADMIN', 'TEAM_LEAD'), deleteWorkingHours);

module.exports = router;
