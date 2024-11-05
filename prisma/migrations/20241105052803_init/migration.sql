-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('student', 'teacher');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "UserAuditLogType" AS ENUM ('created', 'logIn', 'authorizedApp', 'deauthorizedApp');

-- CreateEnum
CREATE TYPE "AppAuditLogType" AS ENUM ('created', 'updated', 'authorizedUser');

-- CreateEnum
CREATE TYPE "Scope" AS ENUM ('basic', 'phone', 'calendar', 'sms');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'others');

-- CreateTable
CREATE TABLE "User" (
    "seiueId" INTEGER NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "phone" TEXT,
    "adminClass0"   TEXT,
    "classTeacher0" TEXT,
    "gender" "Gender" NOT NULL,
    "lastUserAgent" TEXT NOT NULL,
    "admin"         BOOLEAN      NOT NULL DEFAULT false,
    "type" "UserType" NOT NULL,
    "lastSMSVerify" TIMESTAMP(3) NOT NULL DEFAULT '2022-12-07 17:24:53 +00:00',
    "lastSendSMS"   TIMESTAMP(3) NOT NULL DEFAULT '2022-12-07 17:24:53 +00:00',
    "lastSMSPhone"  TEXT,
    "lastSMSCode"   TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("seiueId")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "redirectUrls" TEXT[],
    "scopes" "Scope"[],
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "approved" "ApprovalStatus" NOT NULL,
    "terms"    TEXT,
    "privacy" TEXT,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authorization" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "smsPhone"  TEXT,
    "scopes"    TEXT[],

    CONSTRAINT "Authorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest"
(
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAuditLog" (
    "id" SERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "UserAuditLogType" NOT NULL,
    "userId" INTEGER NOT NULL,
    "values" TEXT[],

    CONSTRAINT "UserAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppAuditLog" (
    "id" SERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "AppAuditLogType" NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "operationUserId" INTEGER NOT NULL,
    "values" TEXT[],

    CONSTRAINT "AppAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_seiueId_key" ON "User"("seiueId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("seiueId") ON DELETE RESTRICT ON UPDATE CASCADE;

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
