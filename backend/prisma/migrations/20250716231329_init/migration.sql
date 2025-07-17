/*
  Warnings:

  - You are about to drop the column `userid` on the `stock` table. All the data in the column will be lost.
  - You are about to drop the `companyinformation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `itemvisitsmercado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ordersmercado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `productsmercado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stockkit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stockvariant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usermagalu` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usermercado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usershopee` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `stock` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "companyinformation" DROP CONSTRAINT "companyinformation_userid_fkey";

-- DropForeignKey
ALTER TABLE "itemvisitsmercado" DROP CONSTRAINT "itemvisitsmercado_userid_fkey";

-- DropForeignKey
ALTER TABLE "ordersmercado" DROP CONSTRAINT "ordersmercado_product_sku_fkey";

-- DropForeignKey
ALTER TABLE "ordersmercado" DROP CONSTRAINT "ordersmercado_userid_fkey";

-- DropForeignKey
ALTER TABLE "productsmercado" DROP CONSTRAINT "productsmercado_userid_fkey";

-- DropForeignKey
ALTER TABLE "stock" DROP CONSTRAINT "stock_userid_fkey";

-- DropForeignKey
ALTER TABLE "stockkit" DROP CONSTRAINT "stockkit_userid_fkey";

-- DropForeignKey
ALTER TABLE "stockvariant" DROP CONSTRAINT "stockvariant_userid_fkey";

-- DropForeignKey
ALTER TABLE "usermagalu" DROP CONSTRAINT "usermagalu_userid_fkey";

-- DropForeignKey
ALTER TABLE "usermercado" DROP CONSTRAINT "usermercado_userid_fkey";

-- DropForeignKey
ALTER TABLE "usershopee" DROP CONSTRAINT "usershopee_userid_fkey";

-- AlterTable
ALTER TABLE "stock" DROP COLUMN "userid",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "companyinformation";

-- DropTable
DROP TABLE "itemvisitsmercado";

-- DropTable
DROP TABLE "ordersmercado";

-- DropTable
DROP TABLE "productsmercado";

-- DropTable
DROP TABLE "stockkit";

-- DropTable
DROP TABLE "stockvariant";

-- DropTable
DROP TABLE "usermagalu";

-- DropTable
DROP TABLE "usermercado";

-- DropTable
DROP TABLE "users";

-- DropTable
DROP TABLE "usershopee";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppUser" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(20),
    "cnpj" VARCHAR(14),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userMercado" (
    "user_mercado_id" SERIAL NOT NULL,
    "nome_mercado" VARCHAR(255) NOT NULL,
    "refresh_token" VARCHAR(255),
    "access_token" VARCHAR(255),
    "userId" INTEGER NOT NULL,

    CONSTRAINT "userMercado_pkey" PRIMARY KEY ("user_mercado_id")
);

-- CreateTable
CREATE TABLE "userMagalu" (
    "user_magalu_id" SERIAL NOT NULL,
    "nome_magalu" VARCHAR(255) NOT NULL,
    "refresh_token" VARCHAR(255),
    "access_token" VARCHAR(255),
    "userId" INTEGER NOT NULL,

    CONSTRAINT "userMagalu_pkey" PRIMARY KEY ("user_magalu_id")
);

-- CreateTable
CREATE TABLE "userShopee" (
    "user_shop_id" BIGINT NOT NULL,
    "nome_shopee" VARCHAR(255) NOT NULL,
    "refresh_token" VARCHAR(255),
    "access_token" VARCHAR(255),
    "userId" INTEGER NOT NULL,

    CONSTRAINT "userShopee_pkey" PRIMARY KEY ("user_shop_id")
);

-- CreateTable
CREATE TABLE "productsMercado" (
    "product_sku" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "pictureUrls" TEXT NOT NULL,
    "color" VARCHAR(50),
    "diameter" VARCHAR(50),
    "available_quantity" INTEGER,
    "userId" INTEGER NOT NULL,
    "date_created" TIMESTAMP(6),
    "last_updated" TIMESTAMP(6),
    "listing" VARCHAR(50),
    "condition" VARCHAR(50),
    "description" TEXT,
    "video_id" VARCHAR(255),
    "warrantyType" VARCHAR(50),
    "warrantyTemp" VARCHAR(50),
    "brand" VARCHAR(50),
    "gtin" VARCHAR(50),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productsMercado_pkey" PRIMARY KEY ("product_sku")
);

-- CreateTable
CREATE TABLE "stockVariant" (
    "spu" INTEGER NOT NULL,
    "sku" VARCHAR(255),
    "nome_do_produto" VARCHAR(255),
    "apelido_do_produto" VARCHAR(100),
    "categorias" VARCHAR(255),
    "codigo_de_barras" VARCHAR(50),
    "data_de_lancamento" DATE,
    "status_da_venda" VARCHAR(10),
    "vendedor" VARCHAR(100),
    "preco_de_varejo" DECIMAL(10,2),
    "custo_de_compra" DECIMAL(10,2),
    "descricao" TEXT,
    "link_do_fornecedor" VARCHAR(255),
    "marca" VARCHAR(100),
    "tamanho" VARCHAR(50),
    "cor" VARCHAR(50),
    "adicionar" VARCHAR(255),
    "peso_do_pacote" DECIMAL(10,2),
    "tamanho_de_embalagem" VARCHAR(50),
    "link_do_video" VARCHAR(255),
    "ncm" VARCHAR(20),
    "cest" VARCHAR(20),
    "unidade" VARCHAR(10),
    "origem" VARCHAR(50),
    "quantidade" INTEGER,
    "transito" INTEGER,
    "disponivel" INTEGER,
    "quantidade_total" INTEGER,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "stockVariant_pkey" PRIMARY KEY ("spu")
);

-- CreateTable
CREATE TABLE "stockKit" (
    "skukit" VARCHAR(55) NOT NULL,
    "sku" VARCHAR(255) NOT NULL,
    "nome_do_produto" VARCHAR(255),
    "apelido_do_produto" VARCHAR(255),
    "categorias" VARCHAR(255),
    "custo_de_compra" DECIMAL(10,2),
    "status_da_venda" VARCHAR(10),
    "skumercado" VARCHAR(50),
    "quantidade" INTEGER,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "stockKit_pkey" PRIMARY KEY ("skukit")
);

-- CreateTable
CREATE TABLE "ordersMercado" (
    "id" SERIAL NOT NULL,
    "order_id" VARCHAR(255) NOT NULL,
    "product_sku" VARCHAR(255) NOT NULL,
    "reason" VARCHAR(255),
    "total_paid_amount" DECIMAL,
    "buyer_nickname" VARCHAR(255),
    "date_last_modified" VARCHAR(90),
    "total_amount" DECIMAL,
    "date_created" TIMESTAMP(6),
    "seller_nickname" VARCHAR(255),
    "status" VARCHAR(255),
    "substatus" VARCHAR(255),
    "status_simc" VARCHAR(255),
    "pack_id" VARCHAR(255),
    "quantity" INTEGER,
    "shipping_id" VARCHAR(255),
    "tracking_number" VARCHAR(255),
    "tracking_method" VARCHAR(255),
    "street_name" VARCHAR(255),
    "receiver_name" VARCHAR(255),
    "address_line" VARCHAR(255),
    "neighborhood" VARCHAR(255),
    "city" VARCHAR(255),
    "state" VARCHAR(255),
    "zip_code" VARCHAR(50),
    "country" VARCHAR(255),
    "pictureurls" TEXT,
    "unit_price" DECIMAL(10,2),
    "color_name" VARCHAR(255),
    "sale_fee" DECIMAL,
    "list_cost" DECIMAL,
    "invoice_id" VARCHAR(255),
    "invoice_key" VARCHAR(255),
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ordersMercado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itemVisitsMercado" (
    "userId" INTEGER NOT NULL,
    "date_from" TIMESTAMP(6) NOT NULL,
    "date_to" TIMESTAMP(6) NOT NULL,
    "total_visits" INTEGER NOT NULL,
    "conversion_rate" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "itemVisitsMercado_pkey" PRIMARY KEY ("userId","date_from","date_to")
);

-- CreateTable
CREATE TABLE "companyInformation" (
    "cnpj" VARCHAR(20) NOT NULL,
    "serial_number" INTEGER,
    "company_name" VARCHAR(255) NOT NULL,
    "tax_type" VARCHAR(50),
    "company_type" VARCHAR(50),
    "state_registration" VARCHAR(50),
    "email" VARCHAR(255) NOT NULL,
    "postal_code" VARCHAR(10),
    "address" VARCHAR(255),
    "address_number" VARCHAR(10),
    "neighborhood" VARCHAR(100),
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "userId" INTEGER NOT NULL,

    CONSTRAINT "companyInformation_pkey" PRIMARY KEY ("cnpj")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_email_key" ON "AppUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "productsMercado_product_sku_userId_key" ON "productsMercado"("product_sku", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ordersMercado_order_id_product_sku_key" ON "ordersMercado"("order_id", "product_sku");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "ordersMercado" ADD CONSTRAINT "ordersMercado_product_sku_fkey" FOREIGN KEY ("product_sku") REFERENCES "productsMercado"("product_sku") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itemVisitsMercado" ADD CONSTRAINT "itemVisitsMercado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companyInformation" ADD CONSTRAINT "companyInformation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
