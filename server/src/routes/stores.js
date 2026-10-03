import { Router } from 'express';
import { prisma } from '../config/db.js';
import { AppError, asyncHandler, ok } from '../utils/errors.js';
import { getStoreAverages } from '../services/ratings.js';
import { getUserStoreIdsByAverage } from '../services/store-order.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { ratingSchema, validate } from '../validators/index.js';

const router = Router();
router.use(authenticateToken, authorizeRoles('NORMAL_USER'));
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page = '1', limit = '10', search, sortBy = 'name', sortOrder = 'asc' } = req.query;
    const take = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const currentPage = Math.max(Number(page) || 1, 1);
    const where = search
      ? {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' } },
            { address: { contains: String(search), mode: 'insensitive' } },
          ],
        }
      : {};
    const skip = (currentPage - 1) * take;
    const [stores, total] = await Promise.all([
      sortBy === 'rating'
        ? getUserStoreIdsByAverage({ search, sortOrder, take, skip }).then(async (ids) => {
            const rows = await prisma.store.findMany({ where: { id: { in: ids } } });
            const byId = new Map(rows.map((store) => [store.id, store]));
            return ids.map((id) => byId.get(id));
          })
        : prisma.store.findMany({
            where,
            orderBy: {
              [['name', 'address'].includes(String(sortBy)) ? sortBy : 'name']:
                sortOrder === 'desc' ? 'desc' : 'asc',
            },
            skip,
            take,
          }),
      prisma.store.count({ where }),
    ]);
    const averages = await getStoreAverages(stores.map(({ id }) => id));
    const myRatings = await prisma.rating.findMany({
      where: { userId: req.user.id, storeId: { in: stores.map((store) => store.id) } },
      select: { storeId: true, rating: true },
    });
    const byStore = new Map(myRatings.map(({ storeId, rating }) => [storeId, rating]));
    ok(res, {
      items: stores.map((store) => ({
        ...store,
        averageRating: averages.get(store.id) ?? null,
        userRating: byStore.get(store.id) ?? null,
      })),
      page: currentPage,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    });
  })
);
const saveRating = async (req, res, update) => {
  const store = await prisma.store.findUnique({
    where: { id: req.params.storeId },
    select: { id: true },
  });
  if (!store) throw new AppError('Store not found', 404);
  if (update) {
    const rating = await prisma.rating.findUnique({
      where: { userId_storeId: { userId: req.user.id, storeId: store.id } },
    });
    if (!rating) throw new AppError('Rating not found', 404);
    return ok(
      res,
      await prisma.rating.update({ where: { id: rating.id }, data: { rating: req.body.rating } }),
      'Rating updated'
    );
  }
  const existing = await prisma.rating.findUnique({
    where: { userId_storeId: { userId: req.user.id, storeId: store.id } },
    select: { id: true },
  });
  if (existing)
    throw new AppError('You have already rated this store. Use the update action instead.', 409);
  ok(
    res,
    await prisma.rating.create({
      data: { userId: req.user.id, storeId: store.id, rating: req.body.rating },
    }),
    'Rating submitted',
    201
  );
};
router.post(
  '/:storeId/ratings',
  validate(ratingSchema),
  asyncHandler((req, res) => saveRating(req, res, false))
);
router.put(
  '/:storeId/ratings',
  validate(ratingSchema),
  asyncHandler((req, res) => saveRating(req, res, true))
);
export default router;
