const express = require('express');
const router = express.Router();
const { getCollaborators, getCollaboratorById, createCollaborator, updateCollaborator, deleteCollaborator, toggleCollaboratorActive } = require('../controllers/collaboratorController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', getCollaborators);
router.get('/:id', getCollaboratorById);
router.post('/', authorize('ADMIN', 'TEAM_LEAD', 'SALE'), createCollaborator);
router.put('/:id', authorize('ADMIN', 'TEAM_LEAD', 'SALE'), updateCollaborator);
router.delete('/:id', authorize('ADMIN', 'TEAM_LEAD'), deleteCollaborator);
router.patch('/:id/toggle-active', authorize('ADMIN', 'TEAM_LEAD'), toggleCollaboratorActive);

module.exports = router;
