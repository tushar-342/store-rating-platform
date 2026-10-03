import { prisma } from '../config/db.js';

export async function getStoreAverages(storeIds) {
  if (!storeIds.length) return new Map();
  const rows = await prisma.rating.groupBy({
    by: ['storeId'],
    where: { storeId: { in: storeIds } },
    _avg: { rating: true },
  });
  return new Map(rows.map(({ storeId, _avg }) => [storeId, _avg.rating]));
}
