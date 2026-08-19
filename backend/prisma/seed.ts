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

  // 2. School Profile - Kings & Queens Preparatory School
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
    },
  });

  const term2 = await prisma.term.create({
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

  // 5. Users for All 8 Roles
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

  // 6. Ghanaian Basic Education Structure Classes (KG 1 to Basic 9 ONLY)
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
  const b9 = await prisma.class.create({ data: { name: 'Basic 9', code: 'B9', level: 'JHS' } }); // Terminal level for BECE

  // Streams / Sections for Classes
  const b7A = await prisma.stream.create({
    data: {
      classId: b7.id,
      name: 'A',
      formTeacherId: formTeacherUser.id,
    },
  });

  await prisma.stream.create({
    data: {
      classId: b7.id,
      name: 'B',
    },
  });

  await prisma.stream.create({
    data: {
      classId: b8.id,
      name: 'A',
    },
  });

  await prisma.stream.create({
    data: {
      classId: b9.id,
      name: 'A (BECE Candidate Class)',
      formTeacherId: formTeacherUser.id,
    },
  });

  await prisma.stream.create({
    data: {
      classId: b4.id,
      name: 'A',
    },
  });

  await prisma.stream.create({
    data: {
      classId: kg1.id,
      name: 'A',
    },
  });
  console.log('✅ Created Ghana Basic Education Levels (KG 1 to Basic 9) & Streams');

  // 7. Core Basic Education Subjects
  const coreMath = await prisma.subject.create({
    data: { name: 'Mathematics', code: 'MATH-BASIC', category: 'CORE', description: 'Ghana Basic Education Mathematics Curriculum' },
  });
  const english = await prisma.subject.create({
    data: { name: 'English Language', code: 'ENG-BASIC', category: 'CORE', description: 'Reading, Grammar, Comprehension and Composition' },
  });
  const science = await prisma.subject.create({
    data: { name: 'Integrated Science', code: 'SCI-BASIC', category: 'CORE', description: 'Foundational Natural and Physical Sciences' },
  });
  const socialStudies = await prisma.subject.create({
    data: { name: 'Social Studies', code: 'SOC-BASIC', category: 'CORE', description: 'Environment, Governance and Citizenship' },
  });
  const ict = await prisma.subject.create({
    data: { name: 'Computing / ICT', code: 'ICT-BASIC', category: 'CORE', description: 'Digital Literacy and Computing' },
  });
  const rme = await prisma.subject.create({
    data: { name: 'Religious & Moral Education (RME)', code: 'RME-BASIC', category: 'CORE', description: 'Moral, Ethical and Spiritual Development' },
  });
  const ghanaianLang = await prisma.subject.create({
    data: { name: 'Ghanaian Language & Culture (Twi/Ga/Ewe)', code: 'GHL-BASIC', category: 'CORE', description: 'Local Language and Cultural Heritage' },
  });
  const bdt = await prisma.subject.create({
    data: { name: 'Creative Arts & Design', code: 'CAD-BASIC', category: 'CORE', description: 'Visual Arts and Design Technology' },
  });

  // Assign teachers
  await prisma.classSubjectTeacher.create({
    data: {
      streamId: b7A.id,
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
  console.log('✅ Created Ghana Basic Education Subjects & Assignments');

  // 8. Assessment Components
  const classScoreComp = await prisma.assessmentComponent.create({
    data: {
      classId: b7.id,
      name: 'Class Assessment / Class Score',
      weightPercentage: 30.0,
    },
  });

  const terminalExamComp = await prisma.assessmentComponent.create({
    data: {
      classId: b7.id,
      name: 'Terminal Exam',
      weightPercentage: 70.0,
    },
  });

  // 9. Students & Guardians
  const student1 = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-001',
      userId: studentUser1.id,
      dob: new Date('2012-04-14'),
      gender: 'MALE',
      address: 'House No. 14, East Legon Hills, Accra',
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
      address: 'Block B, Adjiringanor, Accra',
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
      address: 'House No. 14, East Legon Hills, Accra',
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
  console.log('✅ Created Basic Students & Guardian Mapping');

  // 10. Enrollments
  await prisma.enrollment.create({
    data: {
      studentId: student1.id,
      streamId: b7A.id,
      termId: term1.id,
      rollNumber: 1,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student2.id,
      streamId: b7A.id,
      termId: term1.id,
      rollNumber: 2,
    },
  });

  // 11. Attendance Records
  const today = new Date();
  await prisma.attendance.create({
    data: {
      studentId: student1.id,
      streamId: b7A.id,
      date: today,
      status: 'PRESENT',
      markedById: formTeacherUser.id,
      remark: 'Punctual',
    },
  });

  // 12. Sample Grades & Result
  await prisma.grade.create({
    data: {
      studentId: student1.id,
      streamId: b7A.id,
      subjectId: coreMath.id,
      termId: term1.id,
      componentId: classScoreComp.id,
      score: 27.0,
      maxScore: 30,
    },
  });

  await prisma.grade.create({
    data: {
      studentId: student1.id,
      streamId: b7A.id,
      subjectId: coreMath.id,
      termId: term1.id,
      componentId: terminalExamComp.id,
      score: 64.0,
      maxScore: 70,
    },
  });

  await prisma.termResult.create({
    data: {
      studentId: student1.id,
      streamId: b7A.id,
      termId: term1.id,
      totalScore: 91.0,
      averageScore: 91.0,
      waecGrade: 'A1',
      positionInClass: 1,
      formTeacherRemarks: 'Outstanding basic education pupil. Excellent conduct.',
      headteacherRemarks: 'Promoted to Basic 8.',
    },
  });

  // 13. Fee Structure & Invoices
  await prisma.feeStructure.createMany({
    data: [
      { classId: b7.id, termId: term1.id, name: 'Basic Tuition & Facility Levy', amount: 650.00, description: 'Term 1 Basic Tuition' },
      { classId: b7.id, termId: term1.id, name: 'Feeding & Canteen', amount: 300.00, description: 'Daily basic meal program' },
      { classId: b7.id, termId: term1.id, name: 'PTA Dues', amount: 80.00, description: 'Parent Teacher Association Levy' },
      { classId: b7.id, termId: term1.id, name: 'Terminal Examination Fee', amount: 120.00, description: 'Exam Papers & Printing' },
    ],
  });

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2025-001',
      studentId: student1.id,
      termId: term1.id,
      totalAmount: 1150.00,
      amountPaid: 800.00,
      balance: 350.00,
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
  console.log('✅ Created Fee Structure, Invoices & MoMo Payments');

  // 14. Announcements
  await prisma.announcement.create({
    data: {
      title: 'Welcome to Kings & Queens Preparatory School (2025/2026)',
      content: 'Dear Parents, Staff, and Pupils, welcome to Term 1 at Kings & Queens Preparatory School (KG 1 to Basic 9). BECE orientation for Basic 9 candidates will be announced shortly.',
      authorId: superAdminUser.id,
      priority: 'HIGH',
    },
  });

  // 15. Library Books for Basic School
  const book = await prisma.book.create({
    data: {
      title: 'Cockcrow: Literature for Basic Schools (Basic 7-9)',
      author: 'Ghana Education Service',
      isbn: '978-9988-1-1234-5',
      category: 'Literature',
      totalCopies: 60,
      availableCopies: 59,
    },
  });

  await prisma.borrowRecord.create({
    data: {
      bookId: book.id,
      studentId: student1.id,
      borrowDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'BORROWED',
    },
  });

  console.log('🎉 Seeding completed successfully for Kings & Queens Preparatory School (KG 1 - Basic 9)!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
