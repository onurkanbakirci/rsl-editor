/*
  Warnings:

  - You are about to drop the column `description` on the `rsls` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `rsls` table. All the data in the column will be lost.
  - Added the required column `websiteUrl` to the `rsls` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rsls" DROP COLUMN "description",
DROP COLUMN "title",
ADD COLUMN     "websiteUrl" TEXT NOT NULL;
