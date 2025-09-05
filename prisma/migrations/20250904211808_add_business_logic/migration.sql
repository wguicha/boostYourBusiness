-- AlterTable
ALTER TABLE "public"."Combo" ALTER COLUMN "businessId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Product" ALTER COLUMN "businessId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Sale" ALTER COLUMN "businessId" DROP NOT NULL;
