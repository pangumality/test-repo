
import prisma from './src/config/db.js';

async function reproduce() {
  const email = 'taboacademy@gmail.com'; // School Admin
  console.log(`Fetching user ${email}...`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { school: true }
  });

  if (!user) {
    console.error('User not found!');
    return;
  }
  
  console.log('User found:', { id: user.id, role: user.role, schoolId: user.schoolId });
  
  // Simulate req.user
  const reqUser = user;

  // 1. Test Calendar Logic
  console.log('\n--- Testing Calendar Logic ---');
  try {
    const { schoolId } = reqUser;
    if (!schoolId) {
      console.log('No schoolId, returning empty array.');
    } else {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        console.log(`Querying for range: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);
        
        // We will run the exact queries from calendarController.js
        const [sportEvents, groupStudies, dateSheets, activities, notices, calendarEvents] = await Promise.all([
          prisma.sportEvent.findMany({
            where: { schoolId, startDate: { gte: monthStart, lte: monthEnd } },
            orderBy: { startDate: 'asc' },
          }),
          prisma.groupStudy.findMany({
            where: { schoolId, date: { gte: monthStart, lte: monthEnd } },
            orderBy: { date: 'asc' },
          }),
          prisma.dateSheet.findMany({
            where: { schoolId, date: { gte: monthStart, lte: monthEnd } },
            orderBy: { date: 'asc' },
          }),
          prisma.subjectActivity.findMany({
            where: { schoolId, date: { gte: monthStart, lte: monthEnd } },
            orderBy: { date: 'asc' },
          }),
          prisma.notice.findMany({
            where: { schoolId, createdAt: { gte: monthStart, lte: monthEnd } },
            orderBy: { createdAt: 'asc' },
          }),
          prisma.calendarEvent.findMany({
            where: { schoolId, date: { gte: monthStart, lte: monthEnd } },
            orderBy: { date: 'asc' },
          }),
        ]);
        
        console.log('Calendar queries successful. Counts:', {
            sportEvents: sportEvents.length,
            groupStudies: groupStudies.length,
            dateSheets: dateSheets.length,
            activities: activities.length,
            notices: notices.length,
            calendarEvents: calendarEvents.length
        });
    }
  } catch (error) {
    console.error('Calendar Logic Failed:', error);
  }

  // 2. Test Stats Logic
  console.log('\n--- Testing Stats Logic ---');
  try {
      const { schoolId, role } = reqUser;
      
      // Mimic logic from app.js /api/stats
      if (role === 'super_admin') {
          console.log('Super Admin logic skipped for this user.');
      } else {
          console.log('Running Admin/Teacher stats logic...');
          const [students, teachers, classes, parents] = await Promise.all([
              prisma.student.count({ where: { schoolId } }),
              prisma.user.count({ where: { schoolId, role: 'teacher' } }), 
              prisma.class.count({ where: { schoolId } }),
              prisma.user.count({ where: { schoolId, role: 'parent' } }) 
            ]);
            
            console.log('Stats queries successful:', { students, teachers, classes, parents });
      }

  } catch (error) {
    console.error('Stats Logic Failed:', error);
  }
  
  await prisma.$disconnect();
}

reproduce();
