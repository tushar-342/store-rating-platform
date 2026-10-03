import jwt from 'jsonwebtoken';
import { AppError, asyncHandler } from '../utils/errors.js';

export const authenticateToken = asyncHandler(async (req, _res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new AppError('Authentication required', 401);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { userId: payload.sub };
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
  next();
});

export const authorizeRoles = (...roles) =>
  asyncHandler(async (req, _res, next) => {
    const { prisma } = await import('../config/db.js');
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { id: true, role: true },
    });
    if (!user) throw new AppError('Authentication required', 401);
    if (!roles.includes(user.role))
      throw new AppError('You do not have permission to perform this action', 403);
    req.user = user;
    next();
  });
