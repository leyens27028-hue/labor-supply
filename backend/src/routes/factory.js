const express = require('express');
const router = express.Router();
const { getFactories, getFactoryById, createFactory, updateFactory, deleteFactory, toggleFactoryActive } = require('../controllers/factoryController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', getFactories);
router.get('/:id', getFactoryById);
router.post('/', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), createFactory);
router.put('/:id', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), updateFactory);
router.delete('/:id', authorize('ADMIN', 'DIRECTOR'), deleteFactory);
router.patch('/:id/toggle-active', authorize('ADMIN', 'DIRECTOR'), toggleFactoryActive);

module.exports = router;
