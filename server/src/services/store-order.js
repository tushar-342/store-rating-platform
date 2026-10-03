import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';

function whereClause(filters) {
  const conditions = [];
  for (const [field, value] of Object.entries(filters)) {
    if (value) conditions.push(Prisma.sql`s.${Prisma.raw(`"${field}"`)} ILIKE ${`%${value}%`}`);
  }
  return conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;
}

async function getByAverage({ where, sortOrder, take, skip }) {
  const direction = sortOrder === 'desc' ? Prisma.raw('DESC') : Prisma.raw('ASC');
  const rows = await prisma.$queryRaw`
    SELECT s."id"
    FROM "Store" AS s
    LEFT JOIN "Rating" AS r ON r."storeId" = s."id"
    ${where}
    GROUP BY s."id", s."name"
    ORDER BY AVG(r."rating") ${direction} NULLS LAST, s."name" ASC
    LIMIT ${take} OFFSET ${skip}
  `;
  return rows.map(({ id }) => id);
}

export function getAdminStoreIdsByAverage({ name, email, address, sortOrder, take, skip }) {
  return getByAverage({ where: whereClause({ name, email, address }), sortOrder, take, skip });
}

export function getUserStoreIdsByAverage({ search, sortOrder, take, skip }) {
  const where = search
    ? Prisma.sql`WHERE (s."name" ILIKE ${`%${search}%`} OR s."address" ILIKE ${`%${search}%`})`
    : Prisma.empty;
  return getByAverage({ where, sortOrder, take, skip });
}
