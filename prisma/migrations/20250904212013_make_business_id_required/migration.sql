/*
  Warnings:

  - Made the column `businessId` on table `Combo` required. This step will fail if there are existing NULL values in that column.
  - Made the column `businessId` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `businessId` on table `Sale` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Combo" ALTER COLUMN "businessId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Product" ALTER COLUMN "businessId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Sale" ALTER COLUMN "businessId" SET NOT NULL;
