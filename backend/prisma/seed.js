import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function ensureClass({ schoolId, name }) {
  const existing = await prisma.class.findFirst({ where: { schoolId, name } });
  if (existing) return existing;
  return prisma.class.create({
    data: {
      id: randomUUID(),
      schoolId,
      name,
    },
  });
}

async function ensureSubject({ schoolId, name }) {
  const existing = await prisma.subject.findFirst({ where: { schoolId, name } });
  if (existing) return existing;
  return prisma.subject.create({
    data: {
      id: randomUUID(),
      schoolId,
      name,
    },
  });
}

async function ensureClassSubject({ classId, subjectId, teacherId }) {
  const existing = await prisma.classSubject.findFirst({ where: { classId, subjectId } });
  if (existing) {
    return prisma.classSubject.update({
      where: { id: existing.id },
      data: { teacherId },
    });
  }

  return prisma.classSubject.create({
    data: {
      id: randomUUID(),
      classId,
      subjectId,
      teacherId,
    },
  });
}

async function upsertUser({ schoolId, email, firstName, lastName, passwordPlain, role, gender }) {
  const password = await bcrypt.hash(passwordPlain, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      schoolId,
      firstName,
      lastName,
      password,
      role,
      ...(gender ? { gender } : {}),
    },
    create: {
      id: randomUUID(),
      schoolId,
      email,
      firstName,
      lastName,
      password,
      role,
      ...(gender ? { gender } : {}),
    },
  });
}

async function upsertTeacher({ schoolId, email, firstName, lastName, passwordPlain, employeeNumber }) {
  const user = await upsertUser({
    schoolId,
    email,
    firstName,
    lastName,
    passwordPlain,
    role: 'teacher',
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: user.id },
    update: { employeeNumber },
    create: {
      id: randomUUID(),
      userId: user.id,
      employeeNumber,
    },
  });

  return { user, teacher };
}

async function upsertStudent({
  schoolId,
  email,
  firstName,
  lastName,
  passwordPlain,
  gender,
  classId,
  grade,
  dateOfBirth,
}) {
  const user = await upsertUser({
    schoolId,
    email,
    firstName,
    lastName,
    passwordPlain,
    role: 'student',
    gender,
  });

  const student = await prisma.student.upsert({
    where: { userId: user.id },
    update: {
      schoolId,
      classId,
      grade,
      dateOfBirth,
    },
    create: {
      id: randomUUID(),
      schoolId,
      userId: user.id,
      classId,
      grade,
      dateOfBirth,
    },
  });

  return { user, student };
}

async function seedSchool({
  schoolName,
  schoolCode,
  staffEmail,
  teacherSeed,
  studentSeed,
  latitude,
  longitude,
  attendanceRadiusMeters,
}) {
  console.log(`Creating School: ${schoolName}`);

  const school = await prisma.school.upsert({
    where: { code: schoolCode },
    update: {
      name: schoolName,
      ...(latitude !== undefined ? { latitude } : {}),
      ...(longitude !== undefined ? { longitude } : {}),
      ...(attendanceRadiusMeters !== undefined ? { attendanceRadiusMeters } : {}),
    },
    create: {
      id: randomUUID(),
      name: schoolName,
      code: schoolCode,
      ...(latitude !== undefined ? { latitude } : {}),
      ...(longitude !== undefined ? { longitude } : {}),
      ...(attendanceRadiusMeters !== undefined ? { attendanceRadiusMeters } : {}),
    },
  });

  const classNames = ['Grade 10-A', 'Grade 10-B', 'Grade 10-C'];
  const classes = [];
  for (const name of classNames) {
    classes.push(await ensureClass({ schoolId: school.id, name }));
  }

  if (staffEmail) {
    await upsertUser({
      schoolId: school.id,
      email: staffEmail,
      firstName: schoolCode,
      lastName: 'Admin',
      passwordPlain: 'School@admin',
      role: 'staff',
    });
  }

  const subjects = [];
  const subjectNames = ['Mathematics', 'Science', 'English'];
  for (const name of subjectNames) {
    subjects.push(await ensureSubject({ schoolId: school.id, name }));
  }

  const teachers = [];
  for (let i = 0; i < teacherSeed.length; i++) {
    const t = teacherSeed[i];
    const { teacher } = await upsertTeacher({
      schoolId: school.id,
      email: t.email,
      firstName: t.firstName,
      lastName: t.lastName,
      passwordPlain: t.passwordPlain,
      employeeNumber: t.employeeNumber,
    });
    teachers.push(teacher);

    await ensureClassSubject({
      classId: classes[i % classes.length].id,
      subjectId: subjects[i % subjects.length].id,
      teacherId: teacher.id,
    });
  }

  const students = [];
  for (let i = 0; i < studentSeed.length; i++) {
    const s = studentSeed[i];
    const { student } = await upsertStudent({
      schoolId: school.id,
      email: s.email,
      firstName: s.firstName,
      lastName: s.lastName,
      passwordPlain: s.passwordPlain,
      gender: s.gender,
      classId: classes[i % classes.length].id,
      grade: s.grade,
      dateOfBirth: s.dateOfBirth,
    });
    students.push(student);
  }

  return { school, classes, subjects, teachers, students };
}


async function main() {
  console.log('Starting seed...');

  const tabo = await seedSchool({
    schoolName: 'Tabo Academy',
    schoolCode: 'TABO001',
    latitude: -1.286389,
    longitude: 36.817223,
    attendanceRadiusMeters: 3,
    staffEmail: 'taboacademy@gmail.com',
    teacherSeed: [
      {
        email: 'oneousmality11@gmail.com',
        firstName: 'Oneous',
        lastName: 'Mality',
        passwordPlain: 'Teacher@123',
        employeeNumber: 'EMP001',
      },
      {
        email: 'tabo.teacher2@gmail.com',
        firstName: 'Tabo',
        lastName: 'Teacher2',
        passwordPlain: 'Teacher@123',
        employeeNumber: 'EMP002',
      },
      {
        email: 'tabo.teacher3@gmail.com',
        firstName: 'Tabo',
        lastName: 'Teacher3',
        passwordPlain: 'Teacher@123',
        employeeNumber: 'EMP003',
      },
    ],
    studentSeed: [
      {
        email: 'charity@gmail.com',
        firstName: 'Charity',
        lastName: 'Student',
        passwordPlain: 'Student@123',
        gender: 'female',
        grade: '10',
        dateOfBirth: new Date('2008-01-01'),
      },
      {
        email: 'tabo.student2@gmail.com',
        firstName: 'Tabo',
        lastName: 'Student2',
        passwordPlain: 'Student@123',
        gender: 'male',
        grade: '10',
        dateOfBirth: new Date('2008-02-01'),
      },
      {
        email: 'tabo.student3@gmail.com',
        firstName: 'Tabo',
        lastName: 'Student3',
        passwordPlain: 'Student@123',
        gender: 'female',
        grade: '10',
        dateOfBirth: new Date('2008-03-01'),
      },
    ],
  });

  const nile = await seedSchool({
    schoolName: 'Nile Heights School',
    schoolCode: 'NILE001',
    latitude: 0.347596,
    longitude: 32.582520,
    attendanceRadiusMeters: 3,
    staffEmail: 'nile.admin@gmail.com',
    teacherSeed: [
      {
        email: 'nile.teacher1@gmail.com',
        firstName: 'Nile',
        lastName: 'Teacher1',
        passwordPlain: 'Teacher@123',
        employeeNumber: 'NILE-EMP-001',
      },
      {
        email: 'nile.teacher2@gmail.com',
        firstName: 'Nile',
        lastName: 'Teacher2',
        passwordPlain: 'Teacher@123',
        employeeNumber: 'NILE-EMP-002',
      },
      {
        email: 'nile.teacher3@gmail.com',
        firstName: 'Nile',
        lastName: 'Teacher3',
        passwordPlain: 'Teacher@123',
        employeeNumber: 'NILE-EMP-003',
      },
    ],
    studentSeed: [
      {
        email: 'nile.student1@gmail.com',
        firstName: 'Nile',
        lastName: 'Student1',
        passwordPlain: 'Student@123',
        gender: 'female',
        grade: '10',
        dateOfBirth: new Date('2008-04-01'),
      },
      {
        email: 'nile.student2@gmail.com',
        firstName: 'Nile',
        lastName: 'Student2',
        passwordPlain: 'Student@123',
        gender: 'male',
        grade: '10',
        dateOfBirth: new Date('2008-05-01'),
      },
      {
        email: 'nile.student3@gmail.com',
        firstName: 'Nile',
        lastName: 'Student3',
        passwordPlain: 'Student@123',
        gender: 'female',
        grade: '10',
        dateOfBirth: new Date('2008-06-01'),
      },
    ],
  });

  const sahara = await seedSchool({
    schoolName: 'Sahara Preparatory',
    schoolCode: 'SAHA001',
    latitude: -26.204103,
    longitude: 28.047305,
    attendanceRadiusMeters: 3,
    staffEmail: 'sahara.admin@gmail.com',
    teacherSeed: [
      {
        email: 'sahara.teacher1@gmail.com',
        firstName: 'Sahara',
        lastName: 'Teacher1',
        passwordPlain: 'Teacher@123',
        employeeNumber: 'SAHA-EMP-001',
      },
      {
        email: 'sahara.teacher2@gmail.com',
        firstName: 'Sahara',
        lastName: 'Teacher2',
        passwordPlain: 'Teacher@123',
        employeeNumber: 'SAHA-EMP-002',
      },
      {
        email: 'sahara.teacher3@gmail.com',
        firstName: 'Sahara',
        lastName: 'Teacher3',
        passwordPlain: 'Teacher@123',
        employeeNumber: 'SAHA-EMP-003',
      },
    ],
    studentSeed: [
      {
        email: 'sahara.student1@gmail.com',
        firstName: 'Sahara',
        lastName: 'Student1',
        passwordPlain: 'Student@123',
        gender: 'male',
        grade: '10',
        dateOfBirth: new Date('2008-07-01'),
      },
      {
        email: 'sahara.student2@gmail.com',
        firstName: 'Sahara',
        lastName: 'Student2',
        passwordPlain: 'Student@123',
        gender: 'female',
        grade: '10',
        dateOfBirth: new Date('2008-08-01'),
      },
      {
        email: 'sahara.student3@gmail.com',
        firstName: 'Sahara',
        lastName: 'Student3',
        passwordPlain: 'Student@123',
        gender: 'female',
        grade: '10',
        dateOfBirth: new Date('2008-09-01'),
      },
    ],
  });

  console.log('Creating Super Admin...');
  const adminEmail = 'admin@system.com';
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: adminPassword, schoolId: tabo.school.id, role: 'admin' },
    create: {
      id: randomUUID(),
      schoolId: tabo.school.id,
      email: adminEmail,
      firstName: 'Super',
      lastName: 'Admin',
      password: adminPassword,
      role: 'admin',
    },
  });

  const studentProfile = tabo.students[0];

  // --- Parent ---
  console.log('Creating Parent...');
  const parentEmail = 'charityparent@gmail.com';
  const parentPassword = await bcrypt.hash('Parent@123', 10);

  const parentUser = await prisma.user.upsert({
    where: { email: parentEmail },
    update: { password: parentPassword, schoolId: tabo.school.id, role: 'parent' },
    create: {
      id: randomUUID(),
      schoolId: tabo.school.id,
      email: parentEmail,
      firstName: 'Charity',
      lastName: 'Parent',
      password: parentPassword,
      role: 'parent',
    },
  });

  // Create Parent Profile
  const parentProfile = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      id: randomUUID(),
      userId: parentUser.id,
    },
  });

  // Link Parent to Student
  await prisma.parentStudents.upsert({
    where: {
      parentId_studentId: {
        parentId: parentProfile.id,
        studentId: studentProfile.id,
      },
    },
    update: {},
    create: {
      parentId: parentProfile.id,
      studentId: studentProfile.id,
      relationship: 'Mother',
      isPrimary: true,
    },
  });

  const schools = await prisma.school.count();
  const users = await prisma.user.count();
  const teachers = await prisma.teacher.count();
  const students = await prisma.student.count();
  const classes = await prisma.class.count();
  const subjects = await prisma.subject.count();
  const classSubjects = await prisma.classSubject.count();

  console.log(
    JSON.stringify(
      {
        schools,
        users,
        teachers,
        students,
        classes,
        subjects,
        classSubjects,
        seededSchoolCodes: [tabo.school.code, nile.school.code, sahara.school.code],
      },
      null,
      2,
    ),
  );

  console.log('Seeding finished successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
