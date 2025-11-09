/*
  Warnings:

  - You are about to drop the column `facebookUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `instagramUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `linkedinUrl` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "facebookUrl",
DROP COLUMN "instagramUrl",
DROP COLUMN "linkedinUrl";
