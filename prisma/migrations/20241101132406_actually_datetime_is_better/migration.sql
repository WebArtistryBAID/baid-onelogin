/*
  Warnings:

  - The `lastSMSVerify` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `lastSendSMS` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastSMSVerify",
ADD COLUMN     "lastSMSVerify" TIMESTAMP(3) NOT NULL DEFAULT '2022-12-07 17:24:53 +00:00',
DROP
COLUMN "lastSendSMS",
ADD COLUMN     "lastSendSMS" TIMESTAMP(3) NOT NULL DEFAULT '2022-12-07 17:24:53 +00:00';
