import { randomUUID } from 'node:crypto';
import prisma from '../config/db.js';

// --- Sports ---
export const getSports = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const sports = await prisma.sport.findMany({
            where: { schoolId },
            include: { _count: { select: { teams: true } } },
            orderBy: { name: 'asc' }
        });
        res.json(sports);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sports' });
    }
};

export const createSport = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { name, category } = req.body;
        
        const sport = await prisma.sport.create({
            data: {
                id: randomUUID(),
                schoolId,
                name,
                category
            }
        });
        res.status(201).json(sport);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create sport' });
    }
};

export const deleteSport = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.sport.delete({ where: { id } });
        res.json({ message: 'Sport deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete sport' });
    }
};

// --- Teams ---
export const getTeams = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { sportId } = req.query;
        
        const where = { sport: { schoolId } };
        if (sportId) where.sportId = sportId;

        const teams = await prisma.sportTeam.findMany({
            where,
            include: {
                sport: true,
                coach: { select: { firstName: true, lastName: true } },
                _count: { select: { players: true } }
            }
        });
        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
};

export const createTeam = async (req, res) => {
    try {
        const { sportId, name, coachId } = req.body;
        
        const team = await prisma.sportTeam.create({
            data: {
                id: randomUUID(),
                sportId,
                name,
                coachId
            }
        });
        res.status(201).json(team);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create team' });
    }
};

export const addPlayer = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { studentId, role } = req.body;

        const member = await prisma.sportTeamMember.create({
            data: {
                id: randomUUID(),
                teamId,
                studentId,
                role: role || 'Player'
            }
        });
        res.status(201).json(member);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add player' });
    }
};

export const removePlayer = async (req, res) => {
    try {
        const { memberId } = req.params;
        await prisma.sportTeamMember.delete({ where: { id: memberId } });
        res.json({ message: 'Player removed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove player' });
    }
};

export const getTeamDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const team = await prisma.sportTeam.findUnique({
            where: { id },
            include: {
                sport: true,
                coach: true,
                players: {
                    include: {
                        student: {
                            include: { user: true, klass: true }
                        }
                    }
                },
                matches: true
            }
        });
        if (!team) return res.status(404).json({ error: 'Team not found' });
        res.json(team);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch team details' });
    }
};

// --- Events ---
export const getEvents = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const events = await prisma.sportEvent.findMany({
            where: { schoolId },
            include: { sport: true },
            orderBy: { startDate: 'asc' }
        });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

export const createEvent = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { title, description, startDate, endDate, location, sportId } = req.body;

        if (typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({ error: 'title is required' });
        }
        if (!startDate) {
            return res.status(400).json({ error: 'startDate is required' });
        }

        const parsedStartDate = new Date(startDate);
        if (Number.isNaN(parsedStartDate.getTime())) {
            return res.status(400).json({ error: 'startDate is invalid' });
        }

        let parsedEndDate = null;
        if (endDate !== undefined && endDate !== null && `${endDate}`.trim() !== '' && `${endDate}` !== 'null') {
            parsedEndDate = new Date(endDate);
            if (Number.isNaN(parsedEndDate.getTime())) {
                return res.status(400).json({ error: 'endDate is invalid' });
            }
            if (parsedEndDate.getTime() < parsedStartDate.getTime()) {
                return res.status(400).json({ error: 'endDate must be after startDate' });
            }
        }

        const normalizedSportId =
            sportId === undefined || sportId === null || `${sportId}`.trim() === '' || `${sportId}` === 'null'
                ? null
                : `${sportId}`;

        if (normalizedSportId) {
            const sport = await prisma.sport.findFirst({ where: { id: normalizedSportId, schoolId } });
            if (!sport) {
                return res.status(400).json({ error: 'sportId is invalid for this school' });
            }
        }

        const event = await prisma.sportEvent.create({
            data: {
                id: randomUUID(),
                schoolId,
                title: title.trim(),
                description,
                startDate: parsedStartDate,
                endDate: parsedEndDate,
                location,
                sportId: normalizedSportId
            }
        });
        res.status(201).json(event);
    } catch (error) {
        if (error?.code === 'P2003') {
            return res.status(400).json({ error: 'Invalid reference provided' });
        }
        res.status(500).json({ error: 'Failed to create event' });
    }
};

// --- Matches ---
export const getMatches = async (req, res) => {
    try {
        const { schoolId } = req.user;
        // Matches are linked to teams, teams linked to sport (which has schoolId)
        const matches = await prisma.sportMatch.findMany({
            where: {
                team: { sport: { schoolId } }
            },
            include: { team: { include: { sport: true } } },
            orderBy: { date: 'desc' }
        });
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
};

export const createMatch = async (req, res) => {
    try {
        const { teamId, opponent, date, location, result } = req.body;
        
        const match = await prisma.sportMatch.create({
            data: {
                id: randomUUID(),
                teamId,
                opponent,
                date: new Date(date),
                location,
                result
            }
        });
        res.status(201).json(match);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create match' });
    }
};

export const updateMatchResult = async (req, res) => {
    try {
        const { id } = req.params;
        const { result } = req.body;
        
        const match = await prisma.sportMatch.update({
            where: { id },
            data: { result }
        });
        res.json(match);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update result' });
    }
};
