# StoreScore — Store Rating Platform

A full-stack store discovery and rating app built with React, Vite, Tailwind CSS, Express, PostgreSQL, and Prisma. It provides one login for system administrators, normal users, and store owners, with server-enforced role checks.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+
- PostgreSQL 14+

## Run locally

1. Copy `server/.env.example` to `server/.env`, set `DATABASE_URL` and a strong `JWT_SECRET`.
2. Copy `client/.env.example` to `client/.env` if the API is not at `http://localhost:5000/api`.
3. Install and prepare the database:

```sh
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

4. Run `npm run dev` from the repository root. The API runs at port 5000 and Vite at port 5173.

Demo accounts (password for each is shown):

| Role         | Email               | Password        |
| ------------ | ------------------- | --------------- |
| System admin | `admin@example.com` | `AdminPass@123` |
| Normal user  | `user@example.com`  | `UserPass@123`  |
| Store owner  | `owner@example.com` | `OwnerPass@123` |

The seed also creates a second normal user, second store owner, four stores, and sample ratings. Demo credentials are for local evaluation only.

## Checks

```sh
npm test
npm run lint
npm run build
```

## Architecture

```text
client/                 React UI, role-based routes, API client, tests
server/prisma/          PostgreSQL schema and idempotent demo seed
server/src/config/      Prisma client
server/src/middleware/  Authentication and database role authorization
server/src/routes/      Auth, admin, stores/ratings, owner APIs
server/src/validators/  Zod schemas shared by route handlers
server/src/utils/       API response helpers and centralized errors
server/tests/           API checks
```

Prisma models: `User` (role enum and profile), `Store` (optional owner relation), and `Rating` (foreign keys, indexes, and unique user/store pair). Rating is stored as an integer; averages are derived from actual rating rows. Passwords use bcrypt hashes, and no response includes the hash. JWTs carry the user subject; the server reads the current role from PostgreSQL for every protected route.

## API

All responses use `{ "success": true, "message": "…", "data": … }`; errors use `{ "success": false, "message": "…", "errors": [] }`. Protected endpoints require `Authorization: Bearer <token>`. Query pagination defaults to page 1 and limit 10 (maximum 100); sort order is `asc` or `desc`.

| Method / path                       | Authentication / role | Input and result                                                                      |
| ----------------------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| `GET /api/health`                   | Public                | Health status                                                                         |
| `POST /api/auth/register`           | Public                | `name,email,address,password,confirmPassword`; always creates `NORMAL_USER`           |
| `POST /api/auth/login`              | Public                | `email,password`; returns JWT and safe user profile                                   |
| `GET /api/auth/me`                  | Any signed-in role    | Current safe profile                                                                  |
| `PUT /api/auth/password`            | Any signed-in role    | `currentPassword,newPassword,confirmPassword`                                         |
| `GET /api/admin/dashboard`          | `SYSTEM_ADMIN`        | Live user, store, and rating totals                                                   |
| `GET /api/admin/users`              | `SYSTEM_ADMIN`        | Filters `name,email,address,role`; sorting `sortBy,sortOrder`; `page,limit`           |
| `POST /api/admin/users`             | `SYSTEM_ADMIN`        | `name,email,address,password,role`                                                    |
| `GET /api/admin/users/:id`          | `SYSTEM_ADMIN`        | Safe user detail and owner store summaries                                            |
| `GET /api/admin/stores`             | `SYSTEM_ADMIN`        | Filters `name,email,address`; sorting and pagination; derived averages                |
| `POST /api/admin/stores`            | `SYSTEM_ADMIN`        | `name,email,address,ownerId?`; owner must have `STORE_OWNER` role                     |
| `GET /api/stores`                   | `NORMAL_USER`         | Search name/address with `search`; `page,limit,sortBy,sortOrder`; includes own rating |
| `POST /api/stores/:storeId/ratings` | `NORMAL_USER`         | `{ rating: 1..5 }`; one rating per user/store                                         |
| `PUT /api/stores/:storeId/ratings`  | `NORMAL_USER`         | `{ rating: 1..5 }`; modifies only authenticated user's rating                         |
| `GET /api/owner/dashboard`          | `STORE_OWNER`         | Own assigned store, average, count; empty state if unassigned                         |
| `GET /api/owner/ratings`            | `STORE_OWNER`         | Own store's customer details and ratings; sorted/paginated                            |

Common error statuses: `401` for a missing/invalid token or invalid login; `403` when the authenticated role is not allowed; `404` for an unknown user/store or missing own rating; `409` for duplicate email/rating or an owner already assigned to a store; `422` for invalid request fields; `400` for an incorrect current password. List endpoints return empty `items` when no records match. The owner endpoints return an empty store or ratings list for an unassigned owner.

Validation uses Zod on server requests and browser constraints for forms. Name is 20–60 characters, address up to 400 characters, and password 8–16 characters with uppercase and special characters. Email is normalized to lowercase. PostgreSQL unique constraints backstop email and one-rating-per-store rules. Express Helmet, CORS, JSON size limit, auth rate limiting, and parameterized Prisma queries are enabled.

## Pages

- Public: `/login`, `/register`
- System admin: `/admin/dashboard`, `/admin/users`, `/admin/users/:id`, `/admin/stores`, `/admin/create-user`, `/admin/create-store`, `/admin/change-password`
- Normal user: `/user/stores`, `/user/change-password`
- Store owner: `/owner/dashboard`, `/owner/ratings`, `/owner/change-password`

## Deployment notes

Set production `DATABASE_URL`, a cryptographically random `JWT_SECRET`, and `CLIENT_URL` to the deployed frontend origin. Run Prisma migrations during release with `npx prisma migrate deploy` from `server/`, then start the API with `npm start`. Build the static frontend with `npm run build -w client` and configure its host to serve `client/dist` with SPA fallback. Do not deploy the demo credentials or commit `.env` files.

Repository: https://github.com/tushar-342/store-rating-platform

## Future improvements

Multi-store ownership UI, email verification and account recovery, audit logs for admin changes, database-backed integration test fixtures, and richer search by location.
