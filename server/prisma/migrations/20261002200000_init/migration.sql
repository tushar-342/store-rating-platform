CREATE TYPE "Role" AS ENUM ('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER');

CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "address" VARCHAR(400) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'NORMAL_USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Store" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "address" VARCHAR(400) NOT NULL,
    "ownerId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Rating" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Rating_rating_range" CHECK ("rating" >= 1 AND "rating" <= 5)
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_name_idx" ON "User"("name");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE UNIQUE INDEX "Store_ownerId_key" ON "Store"("ownerId");
CREATE INDEX "Store_name_idx" ON "Store"("name");
CREATE UNIQUE INDEX "Store_email_key" ON "Store"("email");
CREATE INDEX "Store_address_idx" ON "Store"("address");
CREATE UNIQUE INDEX "Rating_userId_storeId_key" ON "Rating"("userId", "storeId");
CREATE INDEX "Rating_userId_idx" ON "Rating"("userId");
CREATE INDEX "Rating_storeId_idx" ON "Rating"("storeId");

ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
