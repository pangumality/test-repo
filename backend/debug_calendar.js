import 'dotenv/config';
import prisma from './src/config/db.js';

async function debugCalendar() {
  try {
    const school = await prisma.school.findFirst();
    if (!school) {
      console.log('No school found');
      return;
    }
    const schoolId = school.id;
    console.log(`Using School ID: ${schoolId}`);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    console.log(`Querying from ${monthStart} to ${monthEnd}`);

    console.log('Querying SportEvent...');
    const sportEvents = await prisma.sportEvent.findMany({
        where: {
          schoolId,
          startDate: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { startDate: 'asc' },
    });
    console.log(`SportEvents: ${sportEvents.length}`);

    console.log('Querying GroupStudy...');
    const groupStudies = await prisma.groupStudy.findMany({
        where: {
          schoolId,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
    });
    console.log(`GroupStudies: ${groupStudies.length}`);

    console.log('Querying DateSheet...');
    const dateSheets = await prisma.dateSheet.findMany({
        where: {
          schoolId,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
    });
    console.log(`DateSheets: ${dateSheets.length}`);

    console.log('Querying SubjectActivity...');
    const activities = await prisma.subjectActivity.findMany({
        where: {
          schoolId,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
    });
    console.log(`SubjectActivities: ${activities.length}`);

    console.log('Querying Notice...');
    const notices = await prisma.notice.findMany({
        where: {
          schoolId,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { createdAt: 'asc' },
    });
    console.log(`Notices: ${notices.length}`);

    console.log('Querying CalendarEvent...');
    const calendarEvents = await prisma.calendarEvent.findMany({
        where: {
          schoolId,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
    });
    console.log(`CalendarEvents: ${calendarEvents.length}`);

    console.log('All queries successful.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCalendar();
