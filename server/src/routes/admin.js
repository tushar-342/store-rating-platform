import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { AppError, asyncHandler, ok } from '../utils/errors.js';
import { getStoreAverages } from '../services/ratings.js';
import { getAdminStoreIdsByAverage } from '../services/store-order.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { adminUserSchema, storeSchema, validate } from '../validators/index.js';

const router = Router();
router.use(authenticateToken, authorizeRoles('SYSTEM_ADMIN'));
router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.rating.count(),
    ]);
    ok(res, { totalUsers, totalStores, totalRatings });
  })
);
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const {
      page = '1',
      limit = '10',
      name,
      email,
      address,
      role,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;
    const take = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const currentPage = Math.max(Number(page) || 1, 1);
    const where = {
      ...(name && { name: { contains: String(name), mode: 'insensitive' } }),
      ...(email && { email: { contains: String(email), mode: 'insensitive' } }),
      ...(address && { address: { contains: String(address), mode: 'insensitive' } }),
      ...(role &&
        ['SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'].includes(String(role)) && { role }),
    };
    const allowed = ['name', 'email', 'address', 'role', 'createdAt'];
    const orderBy = {
      [allowed.includes(sortBy) ? sortBy : 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, address: true, role: true, createdAt: true },
        orderBy,
        skip: (currentPage - 1) * take,
        take,
      }),
      prisma.user.count({ where }),
    ]);
    ok(res, {
      items: users,
      page: currentPage,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    });
  })
);
router.post(
  '/users',
  validate(adminUserSchema),
  asyncHandler(async (req, res) => {
    const { name, email, address, password, role } = req.body;
    const user = await prisma.user.create({
      data: { name, email, address, role, passwordHash: await bcrypt.hash(password, 12) },
      select: { id: true, name: true, email: true, address: true, role: true, createdAt: true },
    });
    ok(res, user, 'User created', 201);
  })
);
router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true,
        stores: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    const averages = await getStoreAverages(user.stores.map(({ id }) => id));
    const stores = user.stores.map((store) => ({
      ...store,
      averageRating: averages.get(store.id) ?? null,
    }));
    ok(res, { ...user, stores });
  })
);
router.get(
  '/stores',
  asyncHandler(async (req, res) => {
    const {
      page = '1',
      limit = '10',
      name,
      email,
      address,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;
    const take = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const currentPage = Math.max(Number(page) || 1, 1);
    const where = {
      ...(name && { name: { contains: String(name), mode: 'insensitive' } }),
      ...(email && { email: { contains: String(email), mode: 'insensitive' } }),
      ...(address && { address: { contains: String(address), mode: 'insensitive' } }),
    };
    const skip = (currentPage - 1) * take;
    const [stores, total] = await Promise.all([
      sortBy === 'rating'
        ? getAdminStoreIdsByAverage({ name, email, address, sortOrder, take, skip }).then(
            async (ids) => {
              const rows = await prisma.store.findMany({ where: { id: { in: ids } } });
              const byId = new Map(rows.map((store) => [store.id, store]));
              return ids.map((id) => byId.get(id));
            }
          )
        : prisma.store.findMany({
            where,
            orderBy: {
              [['name', 'email', 'address', 'createdAt'].includes(String(sortBy))
                ? sortBy
                : 'name']: sortOrder === 'desc' ? 'desc' : 'asc',
            },
            skip,
            take,
          }),
      prisma.store.count({ where }),
    ]);
    const averages = await getStoreAverages(stores.map(({ id }) => id));
    ok(res, {
      items: stores.map((store) => ({ ...store, averageRating: averages.get(store.id) ?? null })),
      page: currentPage,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    });
  })
);
router.post(
  '/stores',
  validate(storeSchema),
  asyncHandler(async (req, res) => {
    if (req.body.ownerId) {
      const owner = await prisma.user.findUnique({
        where: { id: req.body.ownerId },
        select: { role: true },
      });
      if (!owner || owner.role !== 'STORE_OWNER')
        throw new AppError('Assigned owner must be a registered store owner', 422);
    }
    const store = await prisma.store.create({ data: req.body });
    ok(res, { ...store, averageRating: null }, 'Store created', 201);
  })
);
export default router;
