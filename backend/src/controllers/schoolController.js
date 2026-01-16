import prisma from '../config/db.js';

export const getSchools = async (req, res) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
};
