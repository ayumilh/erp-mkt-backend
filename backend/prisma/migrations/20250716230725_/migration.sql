-- CreateTable
CREATE TABLE "stock" (
    "sku" VARCHAR(55) NOT NULL,
    "nome_do_produto" VARCHAR(255),
    "apelido_do_produto" VARCHAR(255),
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
    "skumercado" VARCHAR(50),
    "userid" INTEGER NOT NULL,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("sku")
);

-- CreateTable
CREATE TABLE "ordersmercado" (
    "order_id" VARCHAR(255),
    "product_sku" VARCHAR(255),
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
    "userid" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "companyinformation" (
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
    "userid" INTEGER NOT NULL,

    CONSTRAINT "companyinformation_pkey" PRIMARY KEY ("cnpj")
);

-- CreateTable
CREATE TABLE "itemvisitsmercado" (
    "userid" INTEGER NOT NULL,
    "date_from" TIMESTAMP(6) NOT NULL,
    "date_to" TIMESTAMP(6) NOT NULL,
    "total_visits" INTEGER NOT NULL,
    "conversion_rate" DECIMAL(5,2) NOT NULL
);

-- CreateTable
CREATE TABLE "productsmercado" (
    "product_sku" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "pictureurls" TEXT NOT NULL,
    "color" VARCHAR(50),
    "diameter" VARCHAR(50),
    "available_quantity" INTEGER,
    "userid" INTEGER NOT NULL,
    "date_created" TIMESTAMP(6),
    "last_updated" TIMESTAMP(6),
    "listing" VARCHAR(50),
    "condition" VARCHAR(50),
    "description" TEXT,
    "video_id" VARCHAR(255),
    "warrantytype" VARCHAR(50),
    "warrantytemp" VARCHAR(50),
    "brand" VARCHAR(50),
    "gtin" VARCHAR(50),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productsmercado_pkey" PRIMARY KEY ("product_sku")
);

-- CreateTable
CREATE TABLE "stockkit" (
    "skukit" VARCHAR(55) NOT NULL,
    "sku" VARCHAR(255) NOT NULL,
    "nome_do_produto" VARCHAR(255),
    "apelido_do_produto" VARCHAR(255),
    "categorias" VARCHAR(255),
    "custo_de_compra" DECIMAL(10,2),
    "status_da_venda" VARCHAR(10),
    "skumercado" VARCHAR(50),
    "quantidade" INTEGER,
    "userid" INTEGER NOT NULL,

    CONSTRAINT "stockkit_pkey" PRIMARY KEY ("skukit")
);

-- CreateTable
CREATE TABLE "stockvariant" (
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
    "userid" INTEGER NOT NULL,

    CONSTRAINT "stockvariant_pkey" PRIMARY KEY ("spu")
);

-- CreateTable
CREATE TABLE "usermagalu" (
    "user_magalu_id" SERIAL NOT NULL,
    "nome_magalu" VARCHAR(255) NOT NULL,
    "refresh_token" VARCHAR(255),
    "access_token" VARCHAR(255),
    "userid" INTEGER NOT NULL,

    CONSTRAINT "usermagalu_pkey" PRIMARY KEY ("user_magalu_id")
);

-- CreateTable
CREATE TABLE "usermercado" (
    "user_mercado_id" SERIAL NOT NULL,
    "nome_mercado" VARCHAR(255) NOT NULL,
    "refresh_token" VARCHAR(255),
    "access_token" VARCHAR(255),
    "userid" INTEGER NOT NULL,

    CONSTRAINT "usermercado_pkey" PRIMARY KEY ("user_mercado_id")
);

-- CreateTable
CREATE TABLE "users" (
    "userid" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(20),
    "cnpj" VARCHAR(14),

    CONSTRAINT "users_pkey" PRIMARY KEY ("userid")
);

-- CreateTable
CREATE TABLE "usershopee" (
    "user_shop_id" BIGINT NOT NULL,
    "nome_shopee" VARCHAR(255) NOT NULL,
    "refresh_token" VARCHAR(255),
    "access_token" VARCHAR(255),
    "userid" INTEGER NOT NULL,

    CONSTRAINT "usershopee_pkey" PRIMARY KEY ("user_shop_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "productsmercado_product_sku_userid_key" ON "productsmercado"("product_sku", "userid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordersmercado" ADD CONSTRAINT "ordersmercado_product_sku_fkey" FOREIGN KEY ("product_sku") REFERENCES "productsmercado"("product_sku") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordersmercado" ADD CONSTRAINT "ordersmercado_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "companyinformation" ADD CONSTRAINT "companyinformation_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "itemvisitsmercado" ADD CONSTRAINT "itemvisitsmercado_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "productsmercado" ADD CONSTRAINT "productsmercado_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stockkit" ADD CONSTRAINT "stockkit_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stockvariant" ADD CONSTRAINT "stockvariant_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usermagalu" ADD CONSTRAINT "usermagalu_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usermercado" ADD CONSTRAINT "usermercado_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usershopee" ADD CONSTRAINT "usershopee_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE NO ACTION ON UPDATE NO ACTION;
