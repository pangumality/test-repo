import app, { prisma } from './app.js';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';

dotenv.config();

const PORT = process.env.PORT || 5001;

// Attempt to connect to DB on start
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    const email = 'admin@system.com';
    let school = await prisma.school.findFirst();
    if (!school) {
      school = await prisma.school.create({
        data: { id: randomUUID(), name: 'System', code: 'SYSTEM' }
      });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          id: randomUUID(),
          schoolId: school.id,
          firstName: 'Admin',
          lastName: 'User',
          email,
          password: 'Admin@123',
          role: 'admin',
          isActive: true
        }
      });
      console.log('✅ Super admin inserted:', email);
    } else {
      await prisma.user.update({
        where: { email },
        data: {
          schoolId: existing.schoolId || school.id,
          firstName: 'Admin',
          lastName: 'User',
          password: 'Admin@123',
          role: 'admin',
          isActive: true
        }
      });
      console.log('✅ Super admin updated:', email);
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

startServer();
