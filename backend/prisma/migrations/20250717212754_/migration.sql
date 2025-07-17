/*
  Warnings:

  - The primary key for the `AppUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `itemVisitsMercado` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "companyInformation" DROP CONSTRAINT "companyInformation_userId_fkey";

-- DropForeignKey
ALTER TABLE "itemVisitsMercado" DROP CONSTRAINT "itemVisitsMercado_userId_fkey";

-- DropForeignKey
ALTER TABLE "ordersMercado" DROP CONSTRAINT "ordersMercado_userId_fkey";

-- DropForeignKey
ALTER TABLE "productsMercado" DROP CONSTRAINT "productsMercado_userId_fkey";

-- DropForeignKey
ALTER TABLE "stock" DROP CONSTRAINT "stock_userId_fkey";

-- DropForeignKey
ALTER TABLE "stockKit" DROP CONSTRAINT "stockKit_userId_fkey";

-- DropForeignKey
ALTER TABLE "stockVariant" DROP CONSTRAINT "stockVariant_userId_fkey";

-- DropForeignKey
ALTER TABLE "userMagalu" DROP CONSTRAINT "userMagalu_userId_fkey";

-- DropForeignKey
ALTER TABLE "userMercado" DROP CONSTRAINT "userMercado_userId_fkey";

-- DropForeignKey
ALTER TABLE "userShopee" DROP CONSTRAINT "userShopee_userId_fkey";

-- AlterTable
ALTER TABLE "AppUser" DROP CONSTRAINT "AppUser_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "AppUser_id_seq";

-- AlterTable
ALTER TABLE "companyInformation" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "itemVisitsMercado" DROP CONSTRAINT "itemVisitsMercado_pkey",
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "itemVisitsMercado_pkey" PRIMARY KEY ("userId", "date_from", "date_to");

-- AlterTable
ALTER TABLE "ordersMercado" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "productsMercado" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "stock" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "stockKit" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "stockVariant" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "userMagalu" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "userMercado" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "userShopee" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "userMercado" ADD CONSTRAINT "userMercado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userMagalu" ADD CONSTRAINT "userMagalu_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userShopee" ADD CONSTRAINT "userShopee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productsMercado" ADD CONSTRAINT "productsMercado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stockVariant" ADD CONSTRAINT "stockVariant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stockKit" ADD CONSTRAINT "stockKit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordersMercado" ADD CONSTRAINT "ordersMercado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itemVisitsMercado" ADD CONSTRAINT "itemVisitsMercado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companyInformation" ADD CONSTRAINT "companyInformation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
