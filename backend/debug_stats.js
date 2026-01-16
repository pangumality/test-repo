
import prisma from './src/config/db.js';

async function debugStats() {
  console.log('Starting Stats Debug...');
  
  // Mock a user context (e.g., School Admin)
  // We need a valid schoolId. Let's find one first.
  
  try {
    const school = await prisma.school.findFirst();
    if (!school) {
        console.log('No schools found in DB.');
        return;
    }
    
    const schoolId = school.id;
    console.log(`Testing with School ID: ${schoolId}`);

    console.log('Running Promise.all for stats...');
    const [students, teachers, classes, parents] = await Promise.all([
      prisma.student.count({ where: { schoolId } }),
      prisma.user.count({ where: { schoolId, role: 'teacher' } }), 
      prisma.class.count({ where: { schoolId } }),
      prisma.user.count({ where: { schoolId, role: 'parent' } }) 
    ]);

    console.log('Stats fetched successfully:');
    console.log({ students, teachers, classes, parents });

  } catch (error) {
    console.error('Error during stats debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugStats();
