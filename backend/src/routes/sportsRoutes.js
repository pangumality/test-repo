import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { 
    getSports, createSport, deleteSport,
    getTeams, createTeam, getTeamDetails, addPlayer, removePlayer,
    getEvents, createEvent,
    getMatches, createMatch, updateMatchResult
} from '../controllers/sportsController.js';

const router = express.Router();

router.use(authenticate);

// Sports
router.get('/', getSports);
router.post('/', createSport);
router.delete('/:id', deleteSport);

// Teams
router.get('/teams', getTeams);
router.post('/teams', createTeam);
router.get('/teams/:id', getTeamDetails);
router.post('/teams/:teamId/players', addPlayer);
router.delete('/teams/players/:memberId', removePlayer);

// Events
router.get('/events', getEvents);
router.post('/events', createEvent);

// Matches
router.get('/matches', getMatches);
router.post('/matches', createMatch);
router.put('/matches/:id/result', updateMatchResult);

export default router;
