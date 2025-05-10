/*
  Warnings:

  - You are about to drop the `_AllowedUsers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_AllowedUsers" DROP CONSTRAINT "_AllowedUsers_A_fkey";

-- DropForeignKey
ALTER TABLE "_AllowedUsers" DROP CONSTRAINT "_AllowedUsers_B_fkey";

-- AlterTable
ALTER TABLE "Application"
    ADD COLUMN "allowedUsers" INTEGER[];

-- DropTable
DROP TABLE "_AllowedUsers";
