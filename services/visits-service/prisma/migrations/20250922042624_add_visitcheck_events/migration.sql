-- CreateEnum
CREATE TYPE "public"."CheckType" AS ENUM ('CHECK_IN', 'CHECK_OUT');

-- CreateEnum
CREATE TYPE "public"."CheckSource" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "public"."CheckMethod" AS ENUM ('GEO', 'MANUAL', 'QR');

-- AlterTable
ALTER TABLE "public"."Visit" ADD COLUMN     "plannedLat" DOUBLE PRECISION,
ADD COLUMN     "plannedLng" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."VisitCheck" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "type" "public"."CheckType" NOT NULL,
    "technicianId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceAt" TIMESTAMP(3),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "distanceMeters" INTEGER,
    "source" "public"."CheckSource" NOT NULL DEFAULT 'ONLINE',
    "method" "public"."CheckMethod" NOT NULL DEFAULT 'GEO',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationMsg" TEXT,
    "deviceId" TEXT,
    "ip" TEXT,
    "notes" TEXT,
    "photoUrl" TEXT,
    "idemKeyHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitCheck_idemKeyHash_key" ON "public"."VisitCheck"("idemKeyHash");

-- CreateIndex
CREATE INDEX "VisitCheck_visitId_type_idx" ON "public"."VisitCheck"("visitId", "type");

-- AddForeignKey
ALTER TABLE "public"."VisitCheck" ADD CONSTRAINT "VisitCheck_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "public"."Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
