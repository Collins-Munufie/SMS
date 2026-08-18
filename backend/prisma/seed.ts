import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Ghana School Management System Database...');

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
      name: 'Achimota Basic & Senior High School',
      motto: 'Ut Omnes Unum Sint (That They All May Be One)',
      logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=250',
      address: 'Achimota Mile 7, Accra, Ghana',
      phone: '+233 24 123 4567',
      email: 'info@achimotaschool.edu.gh',
      website: 'https://achimotaschool.edu.gh',
      region: 'Greater Accra',
      city: 'Accra',
      country: 'Ghana',
      currency: 'GHS',
    },
  });
  console.log('✅ Created School Profile:', school.name);

  // 3. Academic Years & Terms
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

  const term3 = await prisma.term.create({
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
      email: 'superadmin@achimota.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Dr. Emmanuel K. Addo',
      role: 'SUPER_ADMIN',
      phone: '+233 20 000 0001',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'registrar@achimota.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Mrs. Patience Baidoo',
      role: 'ADMIN',
      phone: '+233 24 111 2233',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    },
  });

  const mathTeacherUser = await prisma.user.create({
    data: {
      email: 'kwaku.browning@achimota.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Mr. Kwaku Browning',
      role: 'TEACHER',
      phone: '+233 24 555 6677',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    },
  });

  const formTeacherUser = await prisma.user.create({
    data: {
      email: 'abena.mensah@achimota.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Ms. Abena Mensah',
      role: 'FORM_TEACHER',
      phone: '+233 27 888 9900',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    },
  });

  const bursarUser = await prisma.user.create({
    data: {
      email: 'accountant@achimota.edu.gh',
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
      email: 'librarian@achimota.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Mrs. Janet Quartey',
      role: 'LIBRARIAN',
      phone: '+233 20 444 3322',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    },
  });

  const studentUser1 = await prisma.user.create({
    data: {
      email: 'kwame.osei@student.achimota.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Kwame Osei',
      role: 'STUDENT',
      phone: '+233 55 123 9876',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
    },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      email: 'ama.tutu@student.achimota.edu.gh',
      passwordHash: defaultPasswordHash,
      fullName: 'Ama Tutu',
      role: 'STUDENT',
      phone: '+233 55 234 8765',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    },
  });
  console.log('✅ Created Core Users for 8 Roles');

  // 6. Classes & Streams
  const jhs1 = await prisma.class.create({
    data: { name: 'JHS 1', code: 'JHS1', level: 'JHS' },
  });
  const jhs2 = await prisma.class.create({
    data: { name: 'JHS 2', code: 'JHS2', level: 'JHS' },
  });
  const shs1 = await prisma.class.create({
    data: { name: 'SHS 1', code: 'SHS1-ARTS', level: 'SHS' },
  });

  const jhs1Gold = await prisma.stream.create({
    data: {
      classId: jhs1.id,
      name: 'Gold',
      formTeacherId: formTeacherUser.id,
    },
  });

  await prisma.stream.create({
    data: {
      classId: jhs1.id,
      name: 'Green',
    },
  });

  await prisma.stream.create({
    data: {
      classId: shs1.id,
      name: 'General Arts 1',
    },
  });
  console.log('✅ Created Classes & Streams');

  // 7. Subjects
  const coreMath = await prisma.subject.create({
    data: { name: 'Core Mathematics', code: 'MATH101', category: 'CORE', description: 'Basic and High School Core Mathematics' },
  });
  const english = await prisma.subject.create({
    data: { name: 'English Language', code: 'ENG101', category: 'CORE', description: 'Grammar, Comprehension and Essay Writing' },
  });
  await prisma.subject.create({
    data: { name: 'Integrated Science', code: 'SCI101', category: 'CORE', description: 'Physics, Chemistry, Biology Foundations' },
  });
  await prisma.subject.create({
    data: { name: 'Social Studies', code: 'SOC101', category: 'CORE', description: 'Governance, Culture, Environment' },
  });
  await prisma.subject.create({
    data: { name: 'Information & Communication Technology', code: 'ICT101', category: 'CORE', description: 'Computer Basics, Practical Applications' },
  });

  // Assign teachers to subjects in streams
  await prisma.classSubjectTeacher.create({
    data: {
      streamId: jhs1Gold.id,
      subjectId: coreMath.id,
      teacherId: mathTeacherUser.id,
    },
  });

  await prisma.classSubjectTeacher.create({
    data: {
      streamId: jhs1Gold.id,
      subjectId: english.id,
      teacherId: formTeacherUser.id,
    },
  });
  console.log('✅ Created Subjects & Teacher Assignments');

  // 8. Assessment Components
  const classScoreComp = await prisma.assessmentComponent.create({
    data: {
      classId: jhs1.id,
      name: 'Class Score (Continuous Assessment)',
      weightPercentage: 30.0,
    },
  });

  const terminalExamComp = await prisma.assessmentComponent.create({
    data: {
      classId: jhs1.id,
      name: 'Terminal Exam',
      weightPercentage: 70.0,
    },
  });

  // 9. Students & Guardians
  const student1 = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-001',
      userId: studentUser1.id,
      dob: new Date('2011-04-14'),
      gender: 'MALE',
      address: 'House No. 14, Mile 7, Achimota, Accra',
      photoUrl: studentUser1.avatarUrl,
      admissionDate: new Date('2024-09-01'),
      status: 'ACTIVE',
    },
  });

  const student2 = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-002',
      userId: studentUser2.id,
      dob: new Date('2011-08-22'),
      gender: 'FEMALE',
      address: 'Block B, Dome Pillar 2, Accra',
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
      address: 'House No. 14, Mile 7, Achimota, Accra',
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
  console.log('✅ Created Students & Guardian Mapping');

  // 10. Enrollments
  await prisma.enrollment.create({
    data: {
      studentId: student1.id,
      streamId: jhs1Gold.id,
      termId: term1.id,
      rollNumber: 1,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student2.id,
      streamId: jhs1Gold.id,
      termId: term1.id,
      rollNumber: 2,
    },
  });

  // 11. Attendance Records
  const today = new Date();
  await prisma.attendance.create({
    data: {
      studentId: student1.id,
      streamId: jhs1Gold.id,
      date: today,
      status: 'PRESENT',
      markedById: formTeacherUser.id,
      remark: 'Punctual',
    },
  });

  await prisma.attendance.create({
    data: {
      studentId: student2.id,
      streamId: jhs1Gold.id,
      date: today,
      status: 'PRESENT',
      markedById: formTeacherUser.id,
    },
  });

  // 12. Sample Grades & Result
  await prisma.grade.create({
    data: {
      studentId: student1.id,
      streamId: jhs1Gold.id,
      subjectId: coreMath.id,
      termId: term1.id,
      componentId: classScoreComp.id,
      score: 26.5,
      maxScore: 30,
    },
  });

  await prisma.grade.create({
    data: {
      studentId: student1.id,
      streamId: jhs1Gold.id,
      subjectId: coreMath.id,
      termId: term1.id,
      componentId: terminalExamComp.id,
      score: 62.0,
      maxScore: 70,
    },
  });

  await prisma.termResult.create({
    data: {
      studentId: student1.id,
      streamId: jhs1Gold.id,
      termId: term1.id,
      totalScore: 88.5,
      averageScore: 88.5,
      waecGrade: 'A1',
      positionInClass: 1,
      formTeacherRemarks: 'An outstanding performance in Mathematics. Keep up the high standard.',
      headteacherRemarks: 'Promising student with excellent discipline.',
    },
  });

  // 13. Fee Structure & Invoices (GHS Currency)
  await prisma.feeStructure.createMany({
    data: [
      { classId: jhs1.id, termId: term1.id, name: 'Tuition Fee', amount: 850.00, description: 'Term 1 Tuition' },
      { classId: jhs1.id, termId: term1.id, name: 'Feeding & Welfare', amount: 350.00, description: 'Daily lunch & school welfare' },
      { classId: jhs1.id, termId: term1.id, name: 'PTA Levy', amount: 100.00, description: 'Parent Teacher Association Levy' },
      { classId: jhs1.id, termId: term1.id, name: 'Examination Fee', amount: 150.00, description: 'Terminal Exam Materials' },
    ],
  });

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2025-001',
      studentId: student1.id,
      termId: term1.id,
      totalAmount: 1450.00,
      amountPaid: 1000.00,
      balance: 450.00,
      status: 'PARTIAL',
      dueDate: new Date('2025-10-31'),
    },
  });

  await prisma.payment.create({
    data: {
      receiptNumber: 'REC-2025-001',
      invoiceId: invoice.id,
      amountPaid: 1000.00,
      paymentDate: new Date('2025-09-15'),
      paymentMethod: 'MOMO_MTN',
      referenceNumber: 'MTN-293848103',
      receivedById: bursarUser.id,
      notes: 'Paid via MTN Mobile Money',
    },
  });
  console.log('✅ Created Fee Structure, Invoices & Mobile Money Payments (GHS)');

  // 14. Announcements
  await prisma.announcement.create({
    data: {
      title: 'Welcome to Academic Year 2025/2026',
      content: 'Dear Parents, Staff, and Students, we warmly welcome everyone to Term 1. PTA meeting is scheduled for Friday at 3:00 PM.',
      authorId: superAdminUser.id,
      priority: 'HIGH',
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Mid-Term Break Announcement',
      content: 'Please take note that mid-term break starts on October 24th. Mid-term assessments will be published online.',
      authorId: adminUser.id,
      priority: 'NORMAL',
    },
  });

  // 15. Library Books
  const book = await prisma.book.create({
    data: {
      title: 'Cockcrow: Literature for Junior High Schools',
      author: 'Ghana Education Service',
      isbn: '978-9988-1-1234-5',
      category: 'Literature',
      totalCopies: 50,
      availableCopies: 49,
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

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
