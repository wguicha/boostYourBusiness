-- CreateEnum
CREATE TYPE "public"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterTable
ALTER TABLE "public"."BusinessUser" ADD COLUMN     "status" "public"."InvitationStatus" NOT NULL DEFAULT 'ACCEPTED';
