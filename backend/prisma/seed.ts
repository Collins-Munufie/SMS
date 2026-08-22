import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Kings & Queens Preparatory School (Full Timetable, Streams & Conflict Matrix)...');

  // 1. Clear existing data
  await prisma.borrowRecord.deleteMany();
  await prisma.book.deleteMany();
  await prisma.message.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.termResult.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.assessmentComponent.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.studentGuardian.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classSubjectTeacher.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.stream.deleteMany();
  await prisma.class.deleteMany();
  await prisma.term.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.user.deleteMany();
  await prisma.schoolProfile.deleteMany();

  // 2. School Profile
  const school = await prisma.schoolProfile.create({
    data: {
      name: 'Kings & Queens Preparatory School',
      motto: 'Excellence, Royalty & Moral Leadership (KG 1 - Basic 9)',
      logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=250',
      address: 'Plot 12, East Legon Hills, Accra, Ghana',
      phone: '+233 24 123 4567',
      email: 'info@kqprep.edu.gh',
      website: 'https://kqprep.edu.gh',
      region: 'Greater Accra',
      city: 'Accra',
      country: 'Ghana',
      currency: 'GHS',
    },
  });
  console.log('✅ Created School Profile:', school.name);

  // 3. Academic Year & Terms
  const academicYear = await prisma.academicYear.create({
    data: {
      yearLabel: '2025/2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-07-31'),
      isCurrent: true,
    },
  });

  const term1 = await prisma.term.create({
    data: {
      academicYearId: academicYear.id,
      termNumber: 1,
      termLabel: 'Term 1',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-15'),
      isCurrent: true,
      isExamWindowOpen: true,
      isTermLocked: false,
    },
  });

  await prisma.term.create({
    data: {
      academicYearId: academicYear.id,
      termNumber: 2,
      termLabel: 'Term 2',
      startDate: new Date('2026-01-08'),
      endDate: new Date('2026-04-10'),
      isCurrent: false,
    },
  });

  await prisma.term.create({
    data: {
      academicYearId: academicYear.id,
      termNumber: 3,
      termLabel: 'Term 3',
      startDate: new Date('2026-05-04'),
      endDate: new Date('2026-07-31'),
      isCurrent: false,
    },
  });
  console.log('✅ Created Academic Year & 3 Terms');

  // 4. Default Passwords Hashed
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 5. Core Users for All 8 Roles & Additional Faculty
  const superAdminUser = await prisma.user.create({
    data: {
      email: 'superadmin@kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Dr. Emmanuel K. Addo (Headmaster)',
      role: 'SUPER_ADMIN',
      phone: '+233 20 000 0001',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'registrar@kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Mrs. Patience Baidoo (Registrar)',
      role: 'ADMIN',
      phone: '+233 24 111 2233',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    },
  });

  const mathTeacherUser = await prisma.user.create({
    data: {
      email: 'kwaku.browning@kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Mr. Kwaku Browning',
      role: 'TEACHER',
      phone: '+233 24 555 6677',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    },
  });

  const formTeacherUser = await prisma.user.create({
    data: {
      email: 'abena.mensah@kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Ms. Abena Mensah',
      role: 'FORM_TEACHER',
      phone: '+233 27 888 9900',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    },
  });

  const scienceTeacherUser = await prisma.user.create({
    data: {
      email: 'samuel.appiah@kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Mr. Samuel Appiah',
      role: 'TEACHER',
      phone: '+233 24 333 7788',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
    },
  });

  const ictTeacherUser = await prisma.user.create({
    data: {
      email: 'grace.ankrah@kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Mrs. Grace Ankrah',
      role: 'TEACHER',
      phone: '+233 24 444 8899',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    },
  });

  const frenchTeacherUser = await prisma.user.create({
    data: {
      email: 'jean.koffi@kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'M. Jean-Luc Koffi',
      role: 'TEACHER',
      phone: '+233 26 777 1122',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    },
  });

  const bursarUser = await prisma.user.create({
    data: {
      email: 'accountant@kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Mr. Fiifi Amoah (Bursar)',
      role: 'BURSAR',
      phone: '+233 24 333 4455',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    },
  });

  const parentUser = await prisma.user.create({
    data: {
      email: 'kofi.osei@parent.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Mr. Kofi Osei',
      role: 'PARENT',
      phone: '+233 24 999 8877',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=150',
    },
  });

  const librarianUser = await prisma.user.create({
    data: {
      email: 'librarian@kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Mrs. Janet Quartey',
      role: 'LIBRARIAN',
      phone: '+233 20 444 3322',
      avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=150',
    },
  });

  const studentUser1 = await prisma.user.create({
    data: {
      email: 'kwame.osei@student.kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Kwame Osei',
      role: 'STUDENT',
      phone: '+233 55 123 9876',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
    },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      email: 'ama.tutu@student.kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Ama Tutu',
      role: 'STUDENT',
      phone: '+233 55 234 8765',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    },
  });

  console.log('✅ Created Core Users and Faculty Members');

  // 6. Create ALL 11 Basic Education Classes (KG 1 to Basic 9)
  const classList = [
    { name: 'KG 1', code: 'KG1', level: 'KINDERGARTEN' },
    { name: 'KG 2', code: 'KG2', level: 'KINDERGARTEN' },
    { name: 'Basic 1', code: 'B1', level: 'PRIMARY' },
    { name: 'Basic 2', code: 'B2', level: 'PRIMARY' },
    { name: 'Basic 3', code: 'B3', level: 'PRIMARY' },
    { name: 'Basic 4', code: 'B4', level: 'PRIMARY' },
    { name: 'Basic 5', code: 'B5', level: 'PRIMARY' },
    { name: 'Basic 6', code: 'B6', level: 'PRIMARY' },
    { name: 'Basic 7', code: 'B7', level: 'JHS' },
    { name: 'Basic 8', code: 'B8', level: 'JHS' },
    { name: 'Basic 9', code: 'B9', level: 'JHS' },
  ];

  const createdClasses: Record<string, any> = {};
  const createdStreams: Record<string, any> = {};

  for (const c of classList) {
    const cls = await prisma.class.create({ data: c });
    createdClasses[c.code] = cls;

    // Stream A
    const streamA = await prisma.stream.create({
      data: {
        classId: cls.id,
        name: 'A',
        formTeacherId: c.code === 'B7' || c.code === 'B9' ? formTeacherUser.id : null,
      },
    });
    createdStreams[`${c.code}_A`] = streamA;

    // Assessment components
    await prisma.assessmentComponent.createMany({
      data: [
        { classId: cls.id, name: 'Class Test 1', weightPercentage: 10.0, maxScore: 20.0 },
        { classId: cls.id, name: 'Class Test 2', weightPercentage: 10.0, maxScore: 20.0 },
        { classId: cls.id, name: 'Group Work / Project', weightPercentage: 10.0, maxScore: 20.0 },
        { classId: cls.id, name: 'Homework / Exercises', weightPercentage: 10.0, maxScore: 20.0 },
        { classId: cls.id, name: 'Terminal Exam', weightPercentage: 60.0, maxScore: 100.0 },
      ],
    });
  }

  // Stream B for Basic 7
  const b7B = await prisma.stream.create({
    data: { classId: createdClasses['B7'].id, name: 'B' },
  });
  createdStreams['B7_B'] = b7B;

  // Stream B for Basic 8
  const b8B = await prisma.stream.create({
    data: { classId: createdClasses['B8'].id, name: 'B' },
  });
  createdStreams['B8_B'] = b8B;

  console.log('✅ Created ALL 11 Basic Education Classes & Streams (KG 1 - Basic 9)');

  // 7. Full Basic Curriculum Subjects
  const coreMath = await prisma.subject.create({
    data: { name: 'Mathematics', code: 'MATH-BASIC', category: 'CORE', description: 'Ghana Basic Education Mathematics' },
  });
  const english = await prisma.subject.create({
    data: { name: 'English Language', code: 'ENG-BASIC', category: 'CORE', description: 'Reading, Grammar, Composition & Literature' },
  });
  const science = await prisma.subject.create({
    data: { name: 'Integrated Science', code: 'SCI-BASIC', category: 'CORE', description: 'Foundational Natural Sciences & Laboratory Practice' },
  });
  const socialStudies = await prisma.subject.create({
    data: { name: 'Social Studies', code: 'SOC-BASIC', category: 'CORE', description: 'Geography, Governance, History & Culture' },
  });
  const computing = await prisma.subject.create({
    data: { name: 'Computing & ICT', code: 'ICT-BASIC', category: 'CORE', description: 'Information Communication Technology & Coding Basics' },
  });
  const french = await prisma.subject.create({
    data: { name: 'French Language', code: 'FRE-BASIC', category: 'ELECTIVE', description: 'Conversational French & Grammar' },
  });
  const creativeArts = await prisma.subject.create({
    data: { name: 'Creative Arts & Design', code: 'CAD-BASIC', category: 'CORE', description: 'Visual Arts, Music, Dance & Drama' },
  });
  const rme = await prisma.subject.create({
    data: { name: 'Religious & Moral Education', code: 'RME-BASIC', category: 'CORE', description: 'Christianity, Islam, Traditional Ethics & Values' },
  });
  const pe = await prisma.subject.create({
    data: { name: 'Physical & Health Education', code: 'PHE-BASIC', category: 'ELECTIVE', description: 'Athletics, Team Sports & Physical Wellness' },
  });

  // 8. Teacher Allocations Across Streams
  const allocations = [
    // Basic 7A
    { stream: createdStreams['B7_A'], subject: coreMath, teacher: mathTeacherUser },
    { stream: createdStreams['B7_A'], subject: english, teacher: formTeacherUser },
    { stream: createdStreams['B7_A'], subject: science, teacher: scienceTeacherUser },
    { stream: createdStreams['B7_A'], subject: computing, teacher: ictTeacherUser },
    { stream: createdStreams['B7_A'], subject: french, teacher: frenchTeacherUser },
    { stream: createdStreams['B7_A'], subject: socialStudies, teacher: formTeacherUser },
    { stream: createdStreams['B7_A'], subject: creativeArts, teacher: mathTeacherUser },
    { stream: createdStreams['B7_A'], subject: rme, teacher: scienceTeacherUser },
    { stream: createdStreams['B7_A'], subject: pe, teacher: scienceTeacherUser },

    // Basic 7B
    { stream: createdStreams['B7_B'], subject: coreMath, teacher: mathTeacherUser },
    { stream: createdStreams['B7_B'], subject: english, teacher: formTeacherUser },
    { stream: createdStreams['B7_B'], subject: science, teacher: scienceTeacherUser },
    { stream: createdStreams['B7_B'], subject: computing, teacher: ictTeacherUser },
    { stream: createdStreams['B7_B'], subject: french, teacher: frenchTeacherUser },

    // Basic 8A
    { stream: createdStreams['B8_A'], subject: coreMath, teacher: mathTeacherUser },
    { stream: createdStreams['B8_A'], subject: english, teacher: formTeacherUser },
    { stream: createdStreams['B8_A'], subject: science, teacher: scienceTeacherUser },
    { stream: createdStreams['B8_A'], subject: computing, teacher: ictTeacherUser },

    // Basic 9A
    { stream: createdStreams['B9_A'], subject: coreMath, teacher: mathTeacherUser },
    { stream: createdStreams['B9_A'], subject: english, teacher: formTeacherUser },
    { stream: createdStreams['B9_A'], subject: science, teacher: scienceTeacherUser },
    { stream: createdStreams['B9_A'], subject: computing, teacher: ictTeacherUser },
    { stream: createdStreams['B9_A'], subject: french, teacher: frenchTeacherUser },
  ];

  for (const a of allocations) {
    if (a.stream) {
      await prisma.classSubjectTeacher.create({
        data: {
          streamId: a.stream.id,
          subjectId: a.subject.id,
          teacherId: a.teacher.id,
        },
      });
    }
  }
  console.log('✅ Created Subject Allocations');

  // 9. Standard Timetable Slots for Basic 7A (Complete Monday to Friday Weekly Schedule)
  const b7A = createdStreams['B7_A'];

  const b7ASlots = [
    // MONDAY
    { day: 'MONDAY', p: 1, sub: coreMath, teacher: mathTeacherUser, start: '08:00', end: '08:45', room: 'JHS Block Room 7A' },
    { day: 'MONDAY', p: 2, sub: english, teacher: formTeacherUser, start: '08:45', end: '09:30', room: 'JHS Block Room 7A' },
    { day: 'MONDAY', p: 3, sub: science, teacher: scienceTeacherUser, start: '09:30', end: '10:15', room: 'Science Lab 1' },
    // 10:15 - 10:45 SNACK BREAK
    { day: 'MONDAY', p: 4, sub: computing, teacher: ictTeacherUser, start: '10:45', end: '11:30', room: 'ICT Computer Lab' },
    { day: 'MONDAY', p: 5, sub: french, teacher: frenchTeacherUser, start: '11:30', end: '12:15', room: 'JHS Block Room 7A' },
    // 12:15 - 13:00 LUNCH BREAK
    { day: 'MONDAY', p: 6, sub: socialStudies, teacher: formTeacherUser, start: '13:00', end: '13:45', room: 'JHS Block Room 7A' },
    { day: 'MONDAY', p: 7, sub: creativeArts, teacher: mathTeacherUser, start: '13:45', end: '14:30', room: 'Creative Arts Studio' },
    { day: 'MONDAY', p: 8, sub: pe, teacher: scienceTeacherUser, start: '14:30', end: '15:15', room: 'Sports & Football Pitch' },

    // TUESDAY
    { day: 'TUESDAY', p: 1, sub: english, teacher: formTeacherUser, start: '08:00', end: '08:45', room: 'JHS Block Room 7A' },
    { day: 'TUESDAY', p: 2, sub: english, teacher: formTeacherUser, start: '08:45', end: '09:30', room: 'JHS Block Room 7A' },
    { day: 'TUESDAY', p: 3, sub: coreMath, teacher: mathTeacherUser, start: '09:30', end: '10:15', room: 'JHS Block Room 7A' },
    { day: 'TUESDAY', p: 4, sub: science, teacher: scienceTeacherUser, start: '10:45', end: '11:30', room: 'Science Lab 1' },
    { day: 'TUESDAY', p: 5, sub: science, teacher: scienceTeacherUser, start: '11:30', end: '12:15', room: 'Science Lab 1' },
    { day: 'TUESDAY', p: 6, sub: computing, teacher: ictTeacherUser, start: '13:00', end: '13:45', room: 'ICT Computer Lab' },
    { day: 'TUESDAY', p: 7, sub: rme, teacher: scienceTeacherUser, start: '13:45', end: '14:30', room: 'JHS Block Room 7A' },
    { day: 'TUESDAY', p: 8, sub: french, teacher: frenchTeacherUser, start: '14:30', end: '15:15', room: 'JHS Block Room 7A' },

    // WEDNESDAY
    { day: 'WEDNESDAY', p: 1, sub: coreMath, teacher: mathTeacherUser, start: '08:00', end: '08:45', room: 'JHS Block Room 7A' },
    { day: 'WEDNESDAY', p: 2, sub: coreMath, teacher: mathTeacherUser, start: '08:45', end: '09:30', room: 'JHS Block Room 7A' },
    { day: 'WEDNESDAY', p: 3, sub: french, teacher: frenchTeacherUser, start: '09:30', end: '10:15', room: 'JHS Block Room 7A' },
    { day: 'WEDNESDAY', p: 4, sub: socialStudies, teacher: formTeacherUser, start: '10:45', end: '11:30', room: 'JHS Block Room 7A' },
    { day: 'WEDNESDAY', p: 5, sub: english, teacher: formTeacherUser, start: '11:30', end: '12:15', room: 'JHS Block Room 7A' },
    { day: 'WEDNESDAY', p: 6, sub: science, teacher: scienceTeacherUser, start: '13:00', end: '13:45', room: 'Science Lab 1' },
    { day: 'WEDNESDAY', p: 7, sub: computing, teacher: ictTeacherUser, start: '13:45', end: '14:30', room: 'ICT Computer Lab' },
    { day: 'WEDNESDAY', p: 8, sub: creativeArts, teacher: mathTeacherUser, start: '14:30', end: '15:15', room: 'Creative Arts Studio' },

    // THURSDAY
    { day: 'THURSDAY', p: 1, sub: science, teacher: scienceTeacherUser, start: '08:00', end: '08:45', room: 'Science Lab 1' },
    { day: 'THURSDAY', p: 2, sub: coreMath, teacher: mathTeacherUser, start: '08:45', end: '09:30', room: 'JHS Block Room 7A' },
    { day: 'THURSDAY', p: 3, sub: english, teacher: formTeacherUser, start: '09:30', end: '10:15', room: 'JHS Block Room 7A' },
    { day: 'THURSDAY', p: 4, sub: computing, teacher: ictTeacherUser, start: '10:45', end: '11:30', room: 'ICT Computer Lab' },
    { day: 'THURSDAY', p: 5, sub: computing, teacher: ictTeacherUser, start: '11:30', end: '12:15', room: 'ICT Computer Lab' },
    { day: 'THURSDAY', p: 6, sub: rme, teacher: scienceTeacherUser, start: '13:00', end: '13:45', room: 'JHS Block Room 7A' },
    { day: 'THURSDAY', p: 7, sub: socialStudies, teacher: formTeacherUser, start: '13:45', end: '14:30', room: 'JHS Block Room 7A' },
    { day: 'THURSDAY', p: 8, sub: pe, teacher: scienceTeacherUser, start: '14:30', end: '15:15', room: 'Sports & Football Pitch' },

    // FRIDAY
    { day: 'FRIDAY', p: 1, sub: english, teacher: formTeacherUser, start: '08:00', end: '08:45', room: 'JHS Block Room 7A' },
    { day: 'FRIDAY', p: 2, sub: coreMath, teacher: mathTeacherUser, start: '08:45', end: '09:30', room: 'JHS Block Room 7A' },
    { day: 'FRIDAY', p: 3, sub: french, teacher: frenchTeacherUser, start: '09:30', end: '10:15', room: 'JHS Block Room 7A' },
    { day: 'FRIDAY', p: 4, sub: science, teacher: scienceTeacherUser, start: '10:45', end: '11:30', room: 'Science Lab 1' },
    { day: 'FRIDAY', p: 5, sub: creativeArts, teacher: mathTeacherUser, start: '11:30', end: '12:15', room: 'Creative Arts Studio' },
    { day: 'FRIDAY', p: 6, sub: socialStudies, teacher: formTeacherUser, start: '13:00', end: '13:45', room: 'JHS Block Room 7A' },
    { day: 'FRIDAY', p: 7, sub: computing, teacher: ictTeacherUser, start: '13:45', end: '14:30', room: 'ICT Computer Lab' },
    { day: 'FRIDAY', p: 8, sub: rme, teacher: scienceTeacherUser, start: '14:30', end: '15:15', room: 'JHS Block Room 7A' },
  ];

  for (const s of b7ASlots) {
    await prisma.timetableSlot.create({
      data: {
        streamId: b7A.id,
        subjectId: s.sub.id,
        teacherId: s.teacher.id,
        dayOfWeek: s.day,
        period: s.p,
        startTime: s.start,
        endTime: s.end,
        room: s.room,
      },
    });
  }

  // 10. Timetable Slots for Basic 8A & Basic 9A
  const b8A = createdStreams['B8_A'];
  const b8ASlots = [
    // MONDAY: Notice Period 1 has English (Ms. Abena Mensah) so Mr. Kwaku Browning is in B7A
    { day: 'MONDAY', p: 1, sub: english, teacher: formTeacherUser, start: '08:00', end: '08:45', room: 'JHS Block Room 8A' },
    { day: 'MONDAY', p: 2, sub: coreMath, teacher: mathTeacherUser, start: '08:45', end: '09:30', room: 'JHS Block Room 8A' },
    { day: 'MONDAY', p: 3, sub: computing, teacher: ictTeacherUser, start: '09:30', end: '10:15', room: 'ICT Computer Lab' },
    { day: 'MONDAY', p: 4, sub: science, teacher: scienceTeacherUser, start: '10:45', end: '11:30', room: 'Science Lab 1' },
    { day: 'MONDAY', p: 5, sub: coreMath, teacher: mathTeacherUser, start: '11:30', end: '12:15', room: 'JHS Block Room 8A' },

    // TUESDAY
    { day: 'TUESDAY', p: 1, sub: coreMath, teacher: mathTeacherUser, start: '08:00', end: '08:45', room: 'JHS Block Room 8A' },
    { day: 'TUESDAY', p: 2, sub: science, teacher: scienceTeacherUser, start: '08:45', end: '09:30', room: 'Science Lab 1' },
    { day: 'TUESDAY', p: 3, sub: english, teacher: formTeacherUser, start: '09:30', end: '10:15', room: 'JHS Block Room 8A' },
    { day: 'TUESDAY', p: 4, sub: computing, teacher: ictTeacherUser, start: '10:45', end: '11:30', room: 'ICT Computer Lab' },

    // WEDNESDAY
    { day: 'WEDNESDAY', p: 1, sub: science, teacher: scienceTeacherUser, start: '08:00', end: '08:45', room: 'Science Lab 1' },
    { day: 'WEDNESDAY', p: 2, sub: english, teacher: formTeacherUser, start: '08:45', end: '09:30', room: 'JHS Block Room 8A' },
    { day: 'WEDNESDAY', p: 3, sub: coreMath, teacher: mathTeacherUser, start: '09:30', end: '10:15', room: 'JHS Block Room 8A' },
  ];

  for (const s of b8ASlots) {
    await prisma.timetableSlot.create({
      data: {
        streamId: b8A.id,
        subjectId: s.sub.id,
        teacherId: s.teacher.id,
        dayOfWeek: s.day,
        period: s.p,
        startTime: s.start,
        endTime: s.end,
        room: s.room,
      },
    });
  }

  // 11. Timetable Slots for Basic 9A (BECE Candidate Class)
  const b9A = createdStreams['B9_A'];
  const b9ASlots = [
    { day: 'MONDAY', p: 1, sub: science, teacher: scienceTeacherUser, start: '08:00', end: '08:45', room: 'Science Lab 1' },
    { day: 'MONDAY', p: 2, sub: french, teacher: frenchTeacherUser, start: '08:45', end: '09:30', room: 'JHS Block Room 9A' },
    { day: 'MONDAY', p: 3, sub: coreMath, teacher: mathTeacherUser, start: '09:30', end: '10:15', room: 'JHS Block Room 9A' },
    { day: 'MONDAY', p: 4, sub: english, teacher: formTeacherUser, start: '10:45', end: '11:30', room: 'JHS Block Room 9A' },

    { day: 'TUESDAY', p: 1, sub: computing, teacher: ictTeacherUser, start: '08:00', end: '08:45', room: 'ICT Computer Lab' },
    { day: 'TUESDAY', p: 2, sub: coreMath, teacher: mathTeacherUser, start: '08:45', end: '09:30', room: 'JHS Block Room 9A' },
    { day: 'TUESDAY', p: 3, sub: science, teacher: scienceTeacherUser, start: '09:30', end: '10:15', room: 'Science Lab 1' },
  ];

  for (const s of b9ASlots) {
    await prisma.timetableSlot.create({
      data: {
        streamId: b9A.id,
        subjectId: s.sub.id,
        teacherId: s.teacher.id,
        dayOfWeek: s.day,
        period: s.p,
        startTime: s.start,
        endTime: s.end,
        room: s.room,
      },
    });
  }

  console.log('✅ Created Weekly Timetable Schedules for Basic 7A, 8A, and 9A');

  // 12. Students & Guardians
  const student1 = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-001',
      userId: studentUser1.id,
      dob: new Date('2012-04-14'),
      gender: 'MALE',
      address: 'East Legon Hills, Accra',
      photoUrl: studentUser1.avatarUrl,
      admissionDate: new Date('2024-09-01'),
      status: 'ACTIVE',
    },
  });

  const student2 = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-002',
      userId: studentUser2.id,
      dob: new Date('2012-08-22'),
      gender: 'FEMALE',
      address: 'Adjiringanor, Accra',
      photoUrl: studentUser2.avatarUrl,
      admissionDate: new Date('2024-09-01'),
      status: 'ACTIVE',
    },
  });

  const guardian = await prisma.guardian.create({
    data: {
      userId: parentUser.id,
      occupation: 'Civil Servant',
      relationship: 'Father',
      address: 'East Legon Hills, Accra',
      emergencyContact: '+233 24 999 8877',
    },
  });

  await prisma.studentGuardian.create({
    data: {
      studentId: student1.id,
      guardianId: guardian.id,
      isPrimary: true,
    },
  });

  // Enrollments
  await prisma.enrollment.create({
    data: { studentId: student1.id, streamId: b7A.id, termId: term1.id, rollNumber: 1 },
  });
  await prisma.enrollment.create({
    data: { studentId: student2.id, streamId: b7A.id, termId: term1.id, rollNumber: 2 },
  });

  // Fee Structures & MoMo Invoices
  await prisma.feeStructure.createMany({
    data: [
      { classId: createdClasses['B7'].id, termId: term1.id, name: 'Basic Tuition Levy', amount: 650.00, description: 'Term 1 Tuition' },
      { classId: createdClasses['B7'].id, termId: term1.id, name: 'Feeding & Canteen', amount: 300.00, description: 'Daily canteen' },
      { classId: createdClasses['B7'].id, termId: term1.id, name: 'PTA Dues', amount: 80.00, description: 'PTA Levy' },
    ],
  });

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2025-001',
      studentId: student1.id,
      termId: term1.id,
      totalAmount: 1030.00,
      amountPaid: 800.00,
      balance: 230.00,
      status: 'PARTIAL',
      dueDate: new Date('2025-10-31'),
    },
  });

  await prisma.payment.create({
    data: {
      receiptNumber: 'REC-2025-001',
      invoiceId: invoice.id,
      amountPaid: 800.00,
      paymentDate: new Date('2025-09-15'),
      paymentMethod: 'MOMO_MTN',
      referenceNumber: 'MTN-998811002',
      receivedById: bursarUser.id,
      notes: 'Paid via MTN Mobile Money',
    },
  });

  // Announcements
  await prisma.announcement.create({
    data: {
      title: 'Welcome to Kings & Queens Preparatory School (2025/2026)',
      content: 'Welcome to Term 1 of Basic Education (KG 1 to Basic 9). BECE orientation for Basic 9 candidate class is scheduled for next week.',
      authorId: superAdminUser.id,
      priority: 'HIGH',
    },
  });

  console.log('🎉 Full Seeding completed! Real weekly timetable & faculty matrix generated.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
