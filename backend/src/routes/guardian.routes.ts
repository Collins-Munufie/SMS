import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// GET /api/guardians (List all guardians with linked wards)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const where: any = {};
    if (search) {
      where.user = {
        OR: [
          { fullName: { contains: String(search) } },
          { email: { contains: String(search) } },
          { phone: { contains: String(search) } },
        ],
      };
    }

    const guardians = await prisma.guardian.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
        wards: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true, email: true } },
                enrollments: { include: { stream: { include: { class: true } } } },
              },
            },
          },
        },
      },
    });

    res.json({ guardians });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/guardians (Create Guardian & Link Ward)
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, phone, occupation, relationship, address, emergencyContact, studentId } = req.body;

    const passwordHash = await bcrypt.hash(password || 'Password123!', 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: 'PARENT',
        phone,
      },
    });

    const guardian = await prisma.guardian.create({
      data: {
        userId: user.id,
        occupation: occupation || 'Civil Servant',
        relationship: relationship || 'Parent',
        address: address || 'Accra, Ghana',
        emergencyContact: emergencyContact || phone,
      },
    });

    if (studentId) {
      await prisma.studentGuardian.create({
        data: {
          studentId,
          guardianId: guardian.id,
          isPrimary: true,
        },
      });
    }

    res.status(201).json({ message: 'Guardian created and linked successfully', guardian });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
