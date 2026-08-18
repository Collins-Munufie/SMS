import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { authenticateToken, AuthRequest, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        guardianProfile: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials or account inactive' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        studentId: user.studentProfile?.studentId || null,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: {
        studentProfile: {
          include: {
            enrollments: {
              include: {
                stream: {
                  include: {
                    class: true,
                  },
                },
                term: true,
              },
            },
          },
        },
        guardianProfile: {
          include: {
            wards: {
              include: {
                student: {
                  include: {
                    user: true,
                    enrollments: {
                      include: {
                        stream: { include: { class: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/switch-role (Quick dev role impersonation helper)
router.post('/switch-role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!role || !Object.values(Role).includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const targetUser = await prisma.user.findFirst({
      where: { role: role as Role, isActive: true },
      include: { studentProfile: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: `No active demo user found for role ${role}` });
    }

    const payload = {
      id: targetUser.id,
      email: targetUser.email,
      fullName: targetUser.fullName,
      role: targetUser.role,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' });

    res.json({
      message: `Switched to ${role}`,
      token,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.fullName,
        role: targetUser.role,
        phone: targetUser.phone,
        avatarUrl: targetUser.avatarUrl,
        studentId: targetUser.studentProfile?.studentId || null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users
router.get('/users', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    const whereCondition = role ? { role: role as Role } : {};
    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
