/*
  Warnings:

  - The values [approved,disapproved] on the enum `AppAuditLogType` will be removed. If these variants are still used in the database, this will fail.
  - Changed the type of `approved` on the `Application` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterEnum
BEGIN;
CREATE TYPE "AppAuditLogType_new" AS ENUM ('created', 'updated', 'authorizedUser');
ALTER TABLE "AppAuditLog"
    ALTER COLUMN "type" TYPE "AppAuditLogType_new" USING ("type"::text::"AppAuditLogType_new");
ALTER TYPE "AppAuditLogType" RENAME TO "AppAuditLogType_old";
ALTER TYPE "AppAuditLogType_new" RENAME TO "AppAuditLogType";
DROP TYPE "AppAuditLogType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Application"
    DROP COLUMN "approved",
    ADD COLUMN "approved" "ApprovalStatus" NOT NULL;
