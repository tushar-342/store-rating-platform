import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { AppError, asyncHandler, ok } from '../utils/errors.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
  loginSchema,
  registerSchema,
  passwordChangeSchema,
  validate,
} from '../validators/index.js';

const router = Router();
const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  address: user.address,
  role: user.role,
  createdAt: user.createdAt,
});
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const exists = await prisma.user.findUnique({
      where: { email: req.body.email },
      select: { id: true },
    });
    if (exists) throw new AppError('Email is already registered', 409);
    const { name, email, address } = req.body;
    const user = await prisma.user.create({
      data: {
        name,
        email,
        address,
        passwordHash: await bcrypt.hash(req.body.password, 12),
        role: 'NORMAL_USER',
      },
    });
    ok(res, publicUser(user), 'Registration successful', 201);
  })
);
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
      throw new AppError('Invalid email or password', 401);
    const token = jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: '12h' });
    ok(res, { token, user: publicUser(user) }, 'Login successful');
  })
);
router.get(
  '/me',
  authenticateToken,
  authorizeRoles('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    ok(res, publicUser(user));
  })
);
router.put(
  '/password',
  authenticateToken,
  authorizeRoles('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'),
  validate(passwordChangeSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user.id } });
    if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash)))
      throw new AppError('Current password is incorrect', 400);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(req.body.newPassword, 12) },
    });
    ok(res, null, 'Password updated successfully');
  })
);
export default router;
