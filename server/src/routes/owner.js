import { Router } from 'express';
import { prisma } from '../config/db.js';
import { asyncHandler, ok } from '../utils/errors.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken, authorizeRoles('STORE_OWNER'));
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const store = await prisma.store.findFirst({ where: { ownerId: req.user.id } });
    if (!store) return ok(res, { store: null, averageRating: null, totalRatings: 0 });
    const [aggregate, totalRatings] = await Promise.all([
      prisma.rating.aggregate({ where: { storeId: store.id }, _avg: { rating: true } }),
      prisma.rating.count({ where: { storeId: store.id } }),
    ]);
    ok(res, { store, averageRating: aggregate._avg.rating, totalRatings });
  })
);
router.get(
  '/ratings',
  asyncHandler(async (req, res) => {
    const { page = '1', limit = '10', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const store = await prisma.store.findFirst({
      where: { ownerId: req.user.id },
      select: { id: true },
    });
    if (!store) return ok(res, { items: [], page: 1, limit: 10, total: 0, totalPages: 0 });
    const take = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const currentPage = Math.max(Number(page) || 1, 1);
    const field = ['rating', 'createdAt'].includes(sortBy)
      ? sortBy
      : sortBy === 'name' || sortBy === 'email' || sortBy === 'address'
        ? 'user'
        : 'createdAt';
    const orderBy =
      field === 'user'
        ? { user: { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' } }
        : { [field]: sortOrder === 'asc' ? 'asc' : 'desc' };
    const [items, total] = await Promise.all([
      prisma.rating.findMany({
        where: { storeId: store.id },
        select: {
          id: true,
          rating: true,
          createdAt: true,
          user: { select: { name: true, email: true, address: true } },
        },
        orderBy,
        skip: (currentPage - 1) * take,
        take,
      }),
      prisma.rating.count({ where: { storeId: store.id } }),
    ]);
    ok(res, { items, page: currentPage, limit: take, total, totalPages: Math.ceil(total / take) });
  })
);
export default router;
