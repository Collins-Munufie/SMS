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

// In-memory Audit Log Store for User Role Revocations & Reinstatements
export const userAuditLogs: Array<{
  id: string;
  performedBy: string;
  performedByRole: string;
  targetUser: string;
  targetUserEmail: string;
  targetUserRole: string;
  action: 'REVOKED' | 'REINSTATED';
  reason?: string;
  timestamp: string;
}> = [
  {
    id: 'log-1',
    performedBy: 'Dr. Emmanuel K. Addo',
    performedByRole: 'SUPER_ADMIN',
    targetUser: 'Mr. Kofi Osei',
    targetUserEmail: 'kofi.osei@parent.com',
    targetUserRole: 'PARENT',
    action: 'REINSTATED',
    reason: 'Routine security clearance verification completed',
    timestamp: new Date().toISOString(),
  },
];

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
      return res.status(401).json({ error: 'Access Denied: Account inactive or role revoked by Admin' });
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
                stream: { include: { class: true } },
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
                    enrollments: { include: { stream: { include: { class: true } } } },
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

// POST /api/auth/switch-role (Quick dev role impersonation helper with fallbacks)
router.post('/switch-role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!role || !Object.values(Role).includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    let targetUser = await prisma.user.findFirst({
      where: { role: role as Role, isActive: true },
      include: { studentProfile: true },
    });

    // Fallback for TEACHER / FORM_TEACHER if specific role record is inactive
    if (!targetUser && (role === Role.TEACHER || role === Role.FORM_TEACHER)) {
      targetUser = await prisma.user.findFirst({
        where: { role: { in: [Role.TEACHER, Role.FORM_TEACHER] }, isActive: true },
        include: { studentProfile: true },
      });
    }

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
      message: `Switched to ${targetUser.role}`,
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

// GET /api/auth/users (User Directory with search & status filters)
router.get('/users', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { role, search, status } = req.query;
    const whereCondition: any = {};
    if (role) whereCondition.role = role as Role;
    if (status === 'active') whereCondition.isActive = true;
    if (status === 'revoked') whereCondition.isActive = false;
    if (search) {
      whereCondition.OR = [
        { fullName: { contains: String(search) } },
        { email: { contains: String(search) } },
      ];
    }

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

// POST /api/auth/revoke-role (Revoke User Role & Access)
router.post('/revoke-role', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { targetUserId, reason } = req.body;
    const adminUser = req.user!;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    if (targetUserId === adminUser.id) {
      return res.status(400).json({ error: 'Self-Revocation Warning: You cannot revoke your own account access.' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // HIERARCHY SAFEGUARD: Only Super Admin can revoke an Admin or Super Admin!
    if (
      (targetUser.role === Role.ADMIN || targetUser.role === Role.SUPER_ADMIN) &&
      adminUser.role !== Role.SUPER_ADMIN
    ) {
      return res.status(403).json({
        error: 'Permission Denied: Only a Super Admin can revoke an Administrative account.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: false },
    });

    // Create Audit Log Entry
    const logEntry = {
      id: `log-${Date.now()}`,
      performedBy: adminUser.fullName,
      performedByRole: adminUser.role,
      targetUser: targetUser.fullName,
      targetUserEmail: targetUser.email,
      targetUserRole: targetUser.role,
      action: 'REVOKED' as const,
      reason: reason || 'Administrative access revocation',
      timestamp: new Date().toISOString(),
    };
    userAuditLogs.unshift(logEntry);

    res.json({
      message: `Access revoked for ${targetUser.fullName} (${targetUser.role}). User logged out immediately.`,
      user: updatedUser,
      log: logEntry,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reinstate-role (Reinstate User Role & Access)
router.post('/reinstate-role', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { targetUserId, reason } = req.body;
    const adminUser = req.user!;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // HIERARCHY SAFEGUARD: Only Super Admin can reinstate an Admin!
    if (
      (targetUser.role === Role.ADMIN || targetUser.role === Role.SUPER_ADMIN) &&
      adminUser.role !== Role.SUPER_ADMIN
    ) {
      return res.status(403).json({
        error: 'Permission Denied: Only a Super Admin can reinstate an Administrative account.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: true },
    });

    const logEntry = {
      id: `log-${Date.now()}`,
      performedBy: adminUser.fullName,
      performedByRole: adminUser.role,
      targetUser: targetUser.fullName,
      targetUserEmail: targetUser.email,
      targetUserRole: targetUser.role,
      action: 'REINSTATED' as const,
      reason: reason || 'Access restored by Admin',
      timestamp: new Date().toISOString(),
    };
    userAuditLogs.unshift(logEntry);

    res.json({
      message: `Access reinstated for ${targetUser.fullName} (${targetUser.role}).`,
      user: updatedUser,
      log: logEntry,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/audit-logs
router.get('/audit-logs', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    res.json({ logs: userAuditLogs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
