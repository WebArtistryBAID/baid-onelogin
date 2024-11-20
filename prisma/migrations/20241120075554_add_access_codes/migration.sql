-- CreateTable
CREATE TABLE "AccessCode" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "code" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "persistent" BOOLEAN NOT NULL,

    CONSTRAINT "AccessCode_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AccessCode" ADD CONSTRAINT "AccessCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("seiueId") ON DELETE CASCADE ON UPDATE CASCADE;
