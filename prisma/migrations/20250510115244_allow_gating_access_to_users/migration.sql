-- AlterTable
ALTER TABLE "Application"
    ADD COLUMN "accessGated" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "_AllowedUsers"
(
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AllowedUsers_AB_unique" ON "_AllowedUsers" ("A", "B");

-- CreateIndex
CREATE INDEX "_AllowedUsers_B_index" ON "_AllowedUsers" ("B");

-- AddForeignKey
ALTER TABLE "_AllowedUsers"
    ADD CONSTRAINT "_AllowedUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AllowedUsers"
    ADD CONSTRAINT "_AllowedUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("seiueId") ON DELETE CASCADE ON UPDATE CASCADE;
