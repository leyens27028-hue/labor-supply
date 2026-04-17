const express = require('express');
const router = express.Router();
const { getTeams, createTeam, updateTeam, deleteTeam, toggleTeamActive } = require('../controllers/teamController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'DIRECTOR', 'TEAM_LEAD'), getTeams);
router.post('/', authorize('ADMIN'), createTeam);
router.put('/:id', authorize('ADMIN'), updateTeam);
router.delete('/:id', authorize('ADMIN'), deleteTeam);
router.patch('/:id/toggle-active', authorize('ADMIN'), toggleTeamActive);

module.exports = router;
