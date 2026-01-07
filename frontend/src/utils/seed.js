export function seedClasses() {
  const classes = [
    { id: 'class-1', name: 'Grade 1', sections: ['A', 'B'] },
    { id: 'class-2', name: 'Grade 2', sections: ['A', 'B'] },
    { id: 'class-3', name: 'Grade 3', sections: ['A', 'B', 'C'] },
    { id: 'class-4', name: 'Grade 4', sections: ['A', 'B'] },
    { id: 'class-5', name: 'Grade 5', sections: ['A'] },
    { id: 'class-6', name: 'Grade 6', sections: ['A', 'B'] },
  ];
  localStorage.setItem('classes:doonites', JSON.stringify(classes));
  return classes;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function seedTeachers() {
  const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'ICT', 'French'];
  const names = [
    'Alice Johnson','Bernard Mensah','Chandra Patel','Daisy Moyo','Emeka Nwosu','Fatima Bello',
    'George Tetteh','Hannah Abebe','Ibrahim Sule','Jane Doe','Kwame Darko','Lilian Owusu',
    'Maryam Ali','Nana Boateng','Olu Adebayo','Peter Kim','Queen Akosua','Rahul Singh',
    'Sarah Kofi','Thomas Nkrumah'
  ];
  const list = names.map((n, i) => ({
    id: uid(),
    name: n,
    email: `${n.split(' ')[0].toLowerCase()}@doonites.com`,
    role: 'TEACHER',
    subject: subjects[i % subjects.length],
  }));
  localStorage.setItem('teachers:doonites', JSON.stringify(list));
  return list;
}

export function seedStudents(classes) {
  const first = ['Amina','Daniel','Grace','Sam','Rahul','Yara','Chen','Maryam','Peter','Olivia','Kwame','Lara','Victor','Noah','Maya','Ivy','Jason','Kofi','Ama','Zara'];
  const last = ['Kora','Mensah','Okoro','Ndlovu','Patel','Hassan','Li','Ali','Kim','Adebayo','Darko','Owusu','Tetteh','Bello','Nwosu','Moyo','Doe','Boateng','Abebe','Sule'];
  const list = [];
  const cls = classes || JSON.parse(localStorage.getItem('classes:doonites') || '[]');
  let idx = 0;
  for (const c of cls) {
    for (const sec of c.sections) {
      for (let i = 0; i < 6; i++) {
        const name = `${first[idx % first.length]} ${last[(idx + i) % last.length]}`;
        list.push({
          id: uid(),
          name,
          email: `${name.split(' ')[0].toLowerCase()}@school.local`,
          role: 'STUDENT',
          klass: c.id,
          section: sec,
        });
        idx++;
      }
    }
  }
  localStorage.setItem('students:doonites', JSON.stringify(list));
  return list;
}

export function seedParents(students) {
  const list = students.slice(0, 20).map(student => ({
    id: uid(),
    name: `Parent of ${student.name.split(' ')[0]}`,
    email: `parent.${student.email}`,
    role: 'PARENT',
    children: [student.id]
  }));
  localStorage.setItem('parents:doonites', JSON.stringify(list));
  return list;
}

export function seedStaff() {
  const admins = [
    { id: uid(), name: 'Super Admin User', email: 'super@doonites.com', role: 'SUPER_ADMIN' },
    { id: uid(), name: 'Admin User', email: 'admin@doonites.com', role: 'ADMIN' },
  ];
  const librarians = [
    { id: uid(), name: 'Librarian User', email: 'library@doonites.com', role: 'LIBRARIAN' },
  ];
  
  localStorage.setItem('admins:doonites', JSON.stringify(admins));
  localStorage.setItem('librarians:doonites', JSON.stringify(librarians));
  
  return { admins, librarians };
}

export function seedMessages() {
  const teachers = JSON.parse(localStorage.getItem('teachers:doonites') || '[]');
  const students = JSON.parse(localStorage.getItem('students:doonites') || '[]');
  
  if (teachers.length === 0 || students.length === 0) return [];

  const conversations = [];
  const messageTemplates = [
    "Hello, I have a question about the assignment.",
    "Please submit your report by Friday.",
    "Can we meet to discuss my grades?",
    "Don't forget the parent-teacher meeting.",
    "The class schedule has been updated.",
    "Thank you for the update!",
    "I will be absent tomorrow due to illness.",
    "Please bring your textbook to class."
  ];

  // Create conversation between first teacher and first few students
  const activeTeacher = teachers[0]; 

  for (let i = 0; i < 5; i++) {
    const student = students[i];
    const conversationId = uid();
    
    const convoMessages = [];
    const numMessages = 3 + Math.floor(Math.random() * 3);
    
    for (let m = 0; m < numMessages; m++) {
      const isTeacherSender = Math.random() > 0.5;
      convoMessages.push({
        id: uid(),
        content: messageTemplates[Math.floor(Math.random() * messageTemplates.length)],
        senderId: isTeacherSender ? activeTeacher.id : student.id,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * (numMessages - m))).toISOString(),
        read: Math.random() > 0.3
      });
    }

    convoMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    conversations.push({
      id: conversationId,
      participants: [activeTeacher, student],
      messages: convoMessages,
      lastMessage: convoMessages[convoMessages.length - 1],
      updatedAt: convoMessages[convoMessages.length - 1].createdAt
    });
  }

  localStorage.setItem('conversations:doonites', JSON.stringify(conversations));
  return conversations;
}

export function seedAll() {
  const classes = seedClasses();
  const teachers = seedTeachers();
  const students = seedStudents(classes);
  seedParents(students);
  seedStaff();
  seedMessages();
}
