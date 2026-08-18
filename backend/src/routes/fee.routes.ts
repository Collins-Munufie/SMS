import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, AuthRequest, authorizeRoles } from '../middleware/auth';
import { Role, InvoiceStatus, PaymentMethod } from '../types';

const router = Router();

// GET /api/fees/structures
router.get('/structures', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { classId, termId } = req.query;
    const where: any = {};
    if (classId) where.classId = String(classId);
    if (termId) where.termId = String(termId);

    const structures = await prisma.feeStructure.findMany({
      where,
      include: { class: true, term: true },
    });
    res.json({ structures });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fees/structures (Create Fee Structure Item - Bursar / Admin)
router.post('/structures', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.BURSAR), async (req: Request, res: Response) => {
  try {
    const { classId, termId, name, amount, description } = req.body;
    if (!classId || !termId || !name || amount === undefined) {
      return res.status(400).json({ error: 'classId, termId, name, and amount are required' });
    }

    const structure = await prisma.feeStructure.create({
      data: {
        classId,
        termId,
        name,
        amount: Number(amount),
        description,
      },
      include: { class: true, term: true },
    });

    res.status(201).json({ structure });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fees/invoices/generate-bulk (Bulk Invoice Generator for Class Stream)
router.post('/invoices/generate-bulk', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.BURSAR), async (req: Request, res: Response) => {
  try {
    const { streamId, termId, dueDate } = req.body;
    if (!streamId || !termId) {
      return res.status(400).json({ error: 'streamId and termId are required' });
    }

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { class: true },
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Get fee structure total for this class & term
    const feeStructures = await prisma.feeStructure.findMany({
      where: { classId: stream.classId, termId },
    });

    const totalFeeAmount = feeStructures.reduce((sum, item) => sum + item.amount, 0) || 1450.00;

    const enrollments = await prisma.enrollment.findMany({
      where: { streamId, termId },
    });

    let invoiceCount = await prisma.invoice.count();
    const currentYear = new Date().getFullYear();
    const createdInvoices = [];

    for (const en of enrollments) {
      invoiceCount++;
      const invoiceNumber = `INV-${currentYear}-${String(invoiceCount).padStart(3, '0')}`;

      const invoice = await prisma.invoice.upsert({
        where: {
          studentId_termId: {
            studentId: en.studentId,
            termId,
          },
        },
        update: {
          totalAmount: totalFeeAmount,
          balance: Math.max(0, totalFeeAmount - 0),
        },
        create: {
          invoiceNumber,
          studentId: en.studentId,
          termId,
          totalAmount: totalFeeAmount,
          amountPaid: 0,
          balance: totalFeeAmount,
          status: InvoiceStatus.UNPAID,
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      createdInvoices.push(invoice);
    }

    res.status(201).json({
      message: `Generated invoices for ${createdInvoices.length} students in ${stream.class.name} ${stream.name}`,
      count: createdInvoices.length,
      totalFeeAmount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fees/invoices
router.get('/invoices', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { studentId, status } = req.query;
    const where: any = {};
    if (studentId) where.studentId = String(studentId);
    if (status) where.status = String(status);

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
            enrollments: { include: { stream: { include: { class: true } } } },
          },
        },
        term: true,
        payments: {
          include: {
            receivedBy: { select: { fullName: true } },
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ invoices });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fees/defaulters (Outstanding Defaulter List)
router.get('/defaulters', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.BURSAR), async (req: Request, res: Response) => {
  try {
    const defaulters = await prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
        balance: { gt: 0 },
      },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, phone: true, email: true } },
            guardians: {
              include: {
                guardian: {
                  include: { user: { select: { fullName: true, phone: true } } },
                },
              },
            },
            enrollments: { include: { stream: { include: { class: true } } } },
          },
        },
        term: true,
      },
      orderBy: { balance: 'desc' },
    });

    res.json({ defaulters });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fees/payments (Record Payment & Issue Receipt)
router.post('/payments', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.BURSAR), async (req: AuthRequest, res: Response) => {
  try {
    const { invoiceId, amountPaid, paymentMethod, referenceNumber, notes } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const numericAmount = Number(amountPaid);
    if (numericAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0' });
    }

    const count = await prisma.payment.count();
    const currentYear = new Date().getFullYear();
    const receiptNumber = `REC-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    const newAmountPaid = invoice.amountPaid + numericAmount;
    const newBalance = Math.max(0, invoice.totalAmount - newAmountPaid);
    const newStatus = newBalance === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          receiptNumber,
          invoiceId,
          amountPaid: numericAmount,
          paymentMethod: paymentMethod || PaymentMethod.MOMO_MTN,
          referenceNumber: referenceNumber || null,
          receivedById: req.user!.id,
          notes,
        },
      }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
        },
      }),
    ]);

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment,
      receiptNumber,
      remainingBalance: newBalance,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fees/receipt/:paymentId (Payment Receipt Data)
router.get('/receipt/:paymentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId },
      include: {
        receivedBy: { select: { fullName: true } },
        invoice: {
          include: {
            term: true,
            student: {
              include: {
                user: { select: { fullName: true, email: true, phone: true } },
                enrollments: { include: { stream: { include: { class: true } } } },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment receipt not found' });
    }

    const schoolProfile = await prisma.schoolProfile.findFirst();

    res.json({ payment, schoolProfile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fees/summary (Financial Revenue Analytics)
router.get('/summary', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.BURSAR), async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany();
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);

    const payments = await prisma.payment.findMany({
      take: 10,
      orderBy: { paymentDate: 'desc' },
      include: {
        receivedBy: { select: { fullName: true } },
        invoice: {
          include: {
            student: { include: { user: { select: { fullName: true } } } },
          },
        },
      },
    });

    res.json({
      totalBilled,
      totalCollected,
      totalOutstanding,
      collectionRate: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0,
      recentPayments: payments,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
