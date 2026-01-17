/*
  Warnings:

  - You are about to drop the column `name` on the `Skeleton` table. All the data in the column will be lost.
  - Added the required column `details` to the `Skeleton` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `SystemPrompt` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SystemPromptRole" AS ENUM ('DIRECTOR', 'ENGINEER', 'FIXER', 'REMIXER', 'ARCHITECT');

-- AlterTable
ALTER TABLE "Skeleton" DROP COLUMN "name",
ADD COLUMN     "details" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SystemPrompt" DROP COLUMN "role",
ADD COLUMN     "role" "SystemPromptRole" NOT NULL;
