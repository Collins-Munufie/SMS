import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, AuthRequest, authorizeRoles } from '../middleware/auth';
import { Role, InvoiceStatus, PaymentMethod } from '@prisma/client';

const router = Router();

// GET /api/fees/structures
router.get('/structures', authenticateToken, async (req: Request, res: Response) => {
  try {
    const structures = await prisma.feeStructure.findMany({
      include: { class: true, term: true },
    });
    res.json({ structures });
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
    if (status) where.status = status as InvoiceStatus;

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

// GET /api/fees/defaulters
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

// POST /api/fees/payments (Record Payment - Bursar / Admin)
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
    const receiptNumber = `REC-2025-${String(count + 1).padStart(3, '0')}`;

    const newAmountPaid = invoice.amountPaid + numericAmount;
    const newBalance = Math.max(0, invoice.totalAmount - newAmountPaid);
    const newStatus = newBalance === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          receiptNumber,
          invoiceId,
          amountPaid: numericAmount,
          paymentMethod: (paymentMethod as PaymentMethod) || PaymentMethod.MOMO_MTN,
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

// GET /api/fees/summary (Financial Analytics)
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
