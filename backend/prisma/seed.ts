import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Kings & Queens Preparatory School (KG 1 - Basic 9)...');

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

  // 3. Academic Years & 3 Terms
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

  // 4. Default Password Hash
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 5. Core Users for All 8 Roles
  const superAdminUser = await prisma.user.create({
    data: {
      email: 'superadmin@kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Dr. Emmanuel K. Addo',
      role: 'SUPER_ADMIN',
      phone: '+233 20 000 0001',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'registrar@kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Mrs. Patience Baidoo',
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

  const bursarUser = await prisma.user.create({
    data: {
      email: 'accountant@kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Mr. Fiifi Amoah (Bursar)',
      role: 'BURSAR',
      phone: '+233 24 333 4455',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    },
  });

  const parentUser = await prisma.user.create({
    data: {
      email: 'kofi.osei@parent.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Mr. Kofi Osei',
      role: 'PARENT',
      phone: '+233 24 999 8877',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    },
  });

  const librarianUser = await prisma.user.create({
    data: {
      email: 'librarian@kqprep.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Mrs. Janet Quartey',
      role: 'LIBRARIAN',
      phone: '+233 20 444 3322',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
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
  console.log('✅ Created Core Users for 8 Roles');

  // 6. Classes (KG 1 to Basic 9 ONLY)
  const kg1 = await prisma.class.create({ data: { name: 'KG 1', code: 'KG1', level: 'KINDERGARTEN' } });
  const kg2 = await prisma.class.create({ data: { name: 'KG 2', code: 'KG2', level: 'KINDERGARTEN' } });
  const b1 = await prisma.class.create({ data: { name: 'Basic 1', code: 'B1', level: 'PRIMARY' } });
  const b2 = await prisma.class.create({ data: { name: 'Basic 2', code: 'B2', level: 'PRIMARY' } });
  const b3 = await prisma.class.create({ data: { name: 'Basic 3', code: 'B3', level: 'PRIMARY' } });
  const b4 = await prisma.class.create({ data: { name: 'Basic 4', code: 'B4', level: 'PRIMARY' } });
  const b5 = await prisma.class.create({ data: { name: 'Basic 5', code: 'B5', level: 'PRIMARY' } });
  const b6 = await prisma.class.create({ data: { name: 'Basic 6', code: 'B6', level: 'PRIMARY' } });
  const b7 = await prisma.class.create({ data: { name: 'Basic 7', code: 'B7', level: 'JHS' } });
  const b8 = await prisma.class.create({ data: { name: 'Basic 8', code: 'B8', level: 'JHS' } });
  const b9 = await prisma.class.create({ data: { name: 'Basic 9', code: 'B9', level: 'JHS' } });

  // Streams
  const b7A = await prisma.stream.create({
    data: {
      classId: b7.id,
      name: 'A',
      formTeacherId: formTeacherUser.id,
    },
  });

  const b7B = await prisma.stream.create({
    data: {
      classId: b7.id,
      name: 'B',
    },
  });

  // 7. Core Basic Education Subjects
  const coreMath = await prisma.subject.create({
    data: { name: 'Mathematics', code: 'MATH-BASIC', category: 'CORE', description: 'Ghana Basic Education Mathematics' },
  });
  const english = await prisma.subject.create({
    data: { name: 'English Language', code: 'ENG-BASIC', category: 'CORE', description: 'Reading, Grammar, Composition' },
  });
  const science = await prisma.subject.create({
    data: { name: 'Integrated Science', code: 'SCI-BASIC', category: 'CORE', description: 'Foundational Natural Sciences' },
  });

  // Teacher Allocations (Strictly Scope Assigned Subjects)
  await prisma.classSubjectTeacher.create({
    data: {
      streamId: b7A.id,
      subjectId: coreMath.id,
      teacherId: mathTeacherUser.id,
    },
  });

  await prisma.classSubjectTeacher.create({
    data: {
      streamId: b7B.id,
      subjectId: coreMath.id,
      teacherId: mathTeacherUser.id,
    },
  });

  await prisma.classSubjectTeacher.create({
    data: {
      streamId: b7A.id,
      subjectId: english.id,
      teacherId: formTeacherUser.id,
    },
  });
  console.log('✅ Created Teacher Subject Allocations');

  // 8. Admin-Configured Assessment Components with Max Scores & Weights
  const test1 = await prisma.assessmentComponent.create({
    data: { classId: b7.id, name: 'Class Test 1', weightPercentage: 10.0, maxScore: 20.0 },
  });
  const test2 = await prisma.assessmentComponent.create({
    data: { classId: b7.id, name: 'Class Test 2', weightPercentage: 10.0, maxScore: 20.0 },
  });
  const project = await prisma.assessmentComponent.create({
    data: { classId: b7.id, name: 'Group Work / Project', weightPercentage: 10.0, maxScore: 20.0 },
  });
  const homework = await prisma.assessmentComponent.create({
    data: { classId: b7.id, name: 'Homework / Exercises', weightPercentage: 10.0, maxScore: 20.0 },
  });
  const exam = await prisma.assessmentComponent.create({
    data: { classId: b7.id, name: 'Terminal Exam', weightPercentage: 60.0, maxScore: 100.0 },
  });
  console.log('✅ Created Admin-Configured CA & Exam Weightings');

  // 9. Students & Guardians
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

  // 10. Enrollments
  await prisma.enrollment.create({
    data: { studentId: student1.id, streamId: b7A.id, termId: term1.id, rollNumber: 1 },
  });

  await prisma.enrollment.create({
    data: { studentId: student2.id, streamId: b7A.id, termId: term1.id, rollNumber: 2 },
  });

  // 11. Initial CA Sample Scores
  await prisma.grade.create({
    data: { studentId: student1.id, streamId: b7A.id, subjectId: coreMath.id, termId: term1.id, componentId: test1.id, score: 18.0, maxScore: 20.0 },
  });
  await prisma.grade.create({
    data: { studentId: student1.id, streamId: b7A.id, subjectId: coreMath.id, termId: term1.id, componentId: test2.id, score: 17.0, maxScore: 20.0 },
  });
  await prisma.grade.create({
    data: { studentId: student1.id, streamId: b7A.id, subjectId: coreMath.id, termId: term1.id, componentId: project.id, score: 19.0, maxScore: 20.0 },
  });
  await prisma.grade.create({
    data: { studentId: student1.id, streamId: b7A.id, subjectId: coreMath.id, termId: term1.id, componentId: homework.id, score: 16.0, maxScore: 20.0 },
  });
  await prisma.grade.create({
    data: { studentId: student1.id, streamId: b7A.id, subjectId: coreMath.id, termId: term1.id, componentId: exam.id, score: 88.0, maxScore: 100.0 },
  });

  console.log('🎉 Seeding completed for Teacher CA Module!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
