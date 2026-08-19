import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Kings & Queens Preparatory School (Full KG 1 - Basic 9 Stream Allocations)...');

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

    // Create Stream A for EVERY class level
    const streamA = await prisma.stream.create({
      data: {
        classId: cls.id,
        name: 'A',
        formTeacherId: c.code === 'B7' || c.code === 'B9' ? formTeacherUser.id : null,
      },
    });
    createdStreams[`${c.code}_A`] = streamA;

    // Admin Assessment Component Setup for ALL 11 classes
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

  // Create Stream B for Basic 7
  const b7B = await prisma.stream.create({
    data: { classId: createdClasses['B7'].id, name: 'B' },
  });
  createdStreams['B7_B'] = b7B;

  console.log('✅ Created ALL 11 Basic Education Classes (KG 1 - Basic 9) & Streams A/B');

  // 7. Core Basic Subjects
  const coreMath = await prisma.subject.create({
    data: { name: 'Mathematics', code: 'MATH-BASIC', category: 'CORE', description: 'Ghana Basic Education Mathematics' },
  });
  const english = await prisma.subject.create({
    data: { name: 'English Language', code: 'ENG-BASIC', category: 'CORE', description: 'Reading, Grammar, Composition' },
  });
  const science = await prisma.subject.create({
    data: { name: 'Integrated Science', code: 'SCI-BASIC', category: 'CORE', description: 'Foundational Natural Sciences' },
  });

  // Teacher Allocations Across Multiple Classes (Basic 1, Basic 4, Basic 6, Basic 7A, Basic 7B, Basic 8, Basic 9)
  const allocList = [
    { streamKey: 'B1_A', subject: coreMath, teacher: mathTeacherUser },
    { streamKey: 'B4_A', subject: coreMath, teacher: mathTeacherUser },
    { streamKey: 'B6_A', subject: coreMath, teacher: mathTeacherUser },
    { streamKey: 'B7_A', subject: coreMath, teacher: mathTeacherUser },
    { streamKey: 'B7_B', subject: coreMath, teacher: mathTeacherUser },
    { streamKey: 'B8_A', subject: coreMath, teacher: mathTeacherUser },
    { streamKey: 'B9_A', subject: coreMath, teacher: mathTeacherUser },
    { streamKey: 'B7_A', subject: english, teacher: formTeacherUser },
    { streamKey: 'B6_A', subject: english, teacher: formTeacherUser },
  ];

  for (const a of allocList) {
    const streamObj = createdStreams[a.streamKey];
    if (streamObj) {
      await prisma.classSubjectTeacher.create({
        data: {
          streamId: streamObj.id,
          subjectId: a.subject.id,
          teacherId: a.teacher.id,
        },
      });
    }
  }
  console.log('✅ Created Multi-Class Teacher Subject Allocations (Basic 1, 4, 6, 7A, 7B, 8, 9)');

  // 8. Students & Guardians
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

  // 9. Enrollments across Basic 7A
  const stream7A = createdStreams['B7_A'];
  await prisma.enrollment.create({
    data: { studentId: student1.id, streamId: stream7A.id, termId: term1.id, rollNumber: 1 },
  });

  await prisma.enrollment.create({
    data: { studentId: student2.id, streamId: stream7A.id, termId: term1.id, rollNumber: 2 },
  });

  // 10. Fee Structures & MoMo Invoices
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

  // 11. Announcements
  await prisma.announcement.create({
    data: {
      title: 'Welcome to Kings & Queens Preparatory School (2025/2026)',
      content: 'Welcome to Term 1 of Basic Education (KG 1 to Basic 9). BECE orientation for Basic 9 candidate class is scheduled for next week.',
      authorId: superAdminUser.id,
      priority: 'HIGH',
    },
  });

  console.log('🎉 Full Seeding completed! Streams and allocations exist for ALL 11 Basic Education levels (KG 1 - Basic 9).');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
