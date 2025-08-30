-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('PRINCIPAL', 'BEBIDA', 'ACOMPANAMIENTO');

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "type" "public"."ProductType" NOT NULL DEFAULT 'PRINCIPAL';
