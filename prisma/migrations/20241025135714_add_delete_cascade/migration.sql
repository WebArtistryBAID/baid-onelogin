-- DropForeignKey
ALTER TABLE "AppAuditLog" DROP CONSTRAINT "AppAuditLog_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "AppAuditLog" DROP CONSTRAINT "AppAuditLog_operationUserId_fkey";

-- DropForeignKey
ALTER TABLE "ApprovalRequest" DROP CONSTRAINT "ApprovalRequest_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "Authorization" DROP CONSTRAINT "Authorization_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "Authorization" DROP CONSTRAINT "Authorization_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserAuditLog" DROP CONSTRAINT "UserAuditLog_userId_fkey";

-- AddForeignKey
ALTER TABLE "Authorization"
    ADD CONSTRAINT "Authorization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("seiueId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authorization"
    ADD CONSTRAINT "Authorization_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest"
    ADD CONSTRAINT "ApprovalRequest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAuditLog"
    ADD CONSTRAINT "UserAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("seiueId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppAuditLog"
    ADD CONSTRAINT "AppAuditLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppAuditLog"
    ADD CONSTRAINT "AppAuditLog_operationUserId_fkey" FOREIGN KEY ("operationUserId") REFERENCES "User" ("seiueId") ON DELETE CASCADE ON UPDATE CASCADE;
