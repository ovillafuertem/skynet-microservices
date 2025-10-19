/*
  Warnings:

  - You are about to drop the column `address` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `lat` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `lng` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the `Technician` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Visit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_technicianId_fkey";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "address",
DROP COLUMN "lat",
DROP COLUMN "lng";

-- DropTable
DROP TABLE "Technician";

-- DropTable
DROP TABLE "Visit";

-- DropEnum
DROP TYPE "VisitStatus";
