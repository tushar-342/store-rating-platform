import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = 'test-only-secret-for-unit-tests';
const prisma = {
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  store: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  rating: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  $queryRaw: jest.fn(),
};
jest.unstable_mockModule('../src/config/db.js', () => ({ prisma }));
const { default: app } = await import('../src/app.js');

const ids = {
  normal: 'af8a56de-0667-4c98-8593-dcd88f42f333',
  owner: 'f7a1a31f-f933-4fb1-971d-4595508c07d2',
  store: 'a0f4319d-28ee-48f6-9ab9-ab2f39575e71',
  unratedStore: '5d023f11-9599-46ba-bf4a-68a9014a2733',
};
const tokenFor = (id) => jwt.sign({}, process.env.JWT_SECRET, { subject: id });
const userRecord = (role, id = ids.normal) => ({ id, role });

beforeEach(() => jest.clearAllMocks());

describe('authentication, roles, and ownership', () => {
  it('registration always creates a normal user with a password hash and safe response', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({
      id: ids.normal,
      ...data,
      createdAt: new Date(),
    }));
    const response = await request(app).post('/api/auth/register').send({
      name: 'A Properly Long User Name',
      email: 'USER@example.com',
      address: '',
      password: 'UserPass@123',
      confirmPassword: 'UserPass@123',
      role: 'SYSTEM_ADMIN',
    });
    expect(response.status).toBe(201);
    expect(prisma.user.create.mock.calls[0][0].data.role).toBe('NORMAL_USER');
    expect(
      await bcrypt.compare('UserPass@123', prisma.user.create.mock.calls[0][0].data.passwordHash)
    ).toBe(true);
    expect(response.body.data).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate registration before attempting a write', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: ids.normal });
    const response = await request(app).post('/api/auth/register').send({
      name: 'A Properly Long User Name',
      email: 'user@example.com',
      address: '',
      password: 'UserPass@123',
      confirmPassword: 'UserPass@123',
    });
    expect(response.status).toBe(409);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('blocks a normal user from the admin API', async () => {
    prisma.user.findUnique.mockResolvedValue(userRecord('NORMAL_USER'));
    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${tokenFor(ids.normal)}`);
    expect(response.status).toBe(403);
  });

  it('sorts store averages in the database and includes unrated stores', async () => {
    prisma.user.findUnique.mockResolvedValue(userRecord('SYSTEM_ADMIN'));
    prisma.$queryRaw.mockResolvedValue([{ id: ids.store }, { id: ids.unratedStore }]);
    prisma.store.findMany.mockResolvedValue([
      { id: ids.store, name: 'Market Store' },
      { id: ids.unratedStore, name: 'Unrated Store' },
    ]);
    prisma.store.count.mockResolvedValue(2);
    prisma.rating.groupBy.mockResolvedValue([{ storeId: ids.store, _avg: { rating: 4 } }]);
    const response = await request(app)
      .get('/api/admin/stores?sortBy=rating&sortOrder=desc')
      .set('Authorization', `Bearer ${tokenFor(ids.normal)}`);
    expect(response.status).toBe(200);
    expect(response.body.data.items[0].averageRating).toBe(4);
    expect(response.body.data.items[1].averageRating).toBeNull();
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(prisma.$queryRaw.mock.calls[0][0].join('')).toContain('AVG(r."rating")');
    expect(prisma.$queryRaw.mock.calls[0][0].join('')).toContain('NULLS LAST');
  });

  it('creates a rating for the authenticated identity and ignores a supplied userId', async () => {
    prisma.user.findUnique.mockResolvedValue(userRecord('NORMAL_USER'));
    prisma.store.findUnique.mockResolvedValue({ id: ids.store });
    prisma.rating.findUnique.mockResolvedValue(null);
    prisma.rating.create.mockImplementation(async ({ data }) => ({ id: 'rating-id', ...data }));
    const response = await request(app)
      .post(`/api/stores/${ids.store}/ratings`)
      .set('Authorization', `Bearer ${tokenFor(ids.normal)}`)
      .send({ rating: 4, userId: ids.owner });
    expect(response.status).toBe(201);
    expect(prisma.rating.create.mock.calls[0][0].data.userId).toBe(ids.normal);
  });

  it('does not let a store owner choose another store when reading ratings', async () => {
    prisma.user.findUnique.mockResolvedValue(userRecord('STORE_OWNER', ids.owner));
    prisma.store.findFirst.mockResolvedValue({ id: ids.store });
    prisma.rating.findMany.mockResolvedValue([]);
    prisma.rating.count.mockResolvedValue(0);
    const response = await request(app)
      .get('/api/owner/ratings?storeId=other-store')
      .set('Authorization', `Bearer ${tokenFor(ids.owner)}`);
    expect(response.status).toBe(200);
    expect(prisma.store.findFirst).toHaveBeenCalledWith({
      where: { ownerId: ids.owner },
      select: { id: true },
    });
    expect(prisma.rating.findMany.mock.calls[0][0].where.storeId).toBe(ids.store);
  });

  it('cannot modify another user’s rating', async () => {
    prisma.user.findUnique.mockResolvedValue(userRecord('NORMAL_USER'));
    prisma.store.findUnique.mockResolvedValue({ id: ids.store });
    prisma.rating.findUnique.mockResolvedValue(null);
    const response = await request(app)
      .put(`/api/stores/${ids.store}/ratings`)
      .set('Authorization', `Bearer ${tokenFor(ids.normal)}`)
      .send({ rating: 2, userId: ids.owner });
    expect(response.status).toBe(404);
    expect(prisma.rating.findUnique.mock.calls[0][0].where.userId_storeId.userId).toBe(ids.normal);
    expect(prisma.rating.update).not.toHaveBeenCalled();
  });
});
