-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELED', 'NO_SHOW');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "address" TEXT,
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Technician" (
    "id" TEXT NOT NULL,
    "keycloakUserId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Technician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "windowStart" TIMESTAMP(3),
    "windowEnd" TIMESTAMP(3),
    "status" "VisitStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "plannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "checkInAt" TIMESTAMP(3),
    "checkInLat" DOUBLE PRECISION,
    "checkInLng" DOUBLE PRECISION,
    "checkOutAt" TIMESTAMP(3),
    "checkOutLat" DOUBLE PRECISION,
    "checkOutLng" DOUBLE PRECISION,
    "reportData" JSONB,
    "reportSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Technician_keycloakUserId_key" ON "Technician"("keycloakUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Technician_email_key" ON "Technician"("email");

-- CreateIndex
CREATE INDEX "Visit_scheduledDate_idx" ON "Visit"("scheduledDate");

-- CreateIndex
CREATE INDEX "Visit_technicianId_scheduledDate_idx" ON "Visit"("technicianId", "scheduledDate");

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
