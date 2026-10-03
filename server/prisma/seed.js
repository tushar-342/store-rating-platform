import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash('AdminPass@123', 12);
const userHash = await bcrypt.hash('UserPass@123', 12);
const ownerHash = await bcrypt.hash('OwnerPass@123', 12);
async function upsertUser(email, name, role, hash) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      role,
      address: '123 Example Street, Bhopal, Madhya Pradesh',
      passwordHash: hash,
    },
  });
}
try {
  const admin = await upsertUser(
    'admin@example.com',
    'System Administrator Account',
    'SYSTEM_ADMIN',
    passwordHash
  );
  const user = await upsertUser(
    'user@example.com',
    'Regular Platform User',
    'NORMAL_USER',
    userHash
  );
  const user2 = await upsertUser(
    'user2@example.com',
    'Another Platform User',
    'NORMAL_USER',
    userHash
  );
  const owner = await upsertUser(
    'owner@example.com',
    'Primary Store Owner Account',
    'STORE_OWNER',
    ownerHash
  );
  const owner2 = await upsertUser(
    'owner2@example.com',
    'Secondary Store Owner Account',
    'STORE_OWNER',
    ownerHash
  );
  const stores = [
    ['Central Market Grocery', 'central@example.com', owner],
    ['City Books and Stationery', 'books@example.com', owner2],
    ['Bhopal Home Essentials', 'home@example.com', null],
    ['Lakeview Electronics Store', 'lakeview@example.com', null],
  ];
  for (const [name, email, assignedOwner] of stores) {
    const store = await prisma.store.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        address: '10 Main Road, Bhopal, Madhya Pradesh',
        ownerId: assignedOwner?.id,
      },
    });
    if (store.email === 'central@example.com') {
      await prisma.rating.upsert({
        where: { userId_storeId: { userId: user.id, storeId: store.id } },
        update: {},
        create: { userId: user.id, storeId: store.id, rating: 5 },
      });
      await prisma.rating.upsert({
        where: { userId_storeId: { userId: user2.id, storeId: store.id } },
        update: {},
        create: { userId: user2.id, storeId: store.id, rating: 4 },
      });
    }
  }
  console.log(`Seeded demo data for ${admin.email}`);
} finally {
  await prisma.$disconnect();
}
