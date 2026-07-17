/*
  Warnings:

  - You are about to drop the column `fileData` on the `MediaFile` table. All the data in the column will be lost.
  - Added the required column `url` to the `MediaFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MediaFile" DROP COLUMN "fileData",
ADD COLUMN     "url" TEXT NOT NULL;
