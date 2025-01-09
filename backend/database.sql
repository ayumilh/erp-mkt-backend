-- SQLS CREATE COMANDOS

CREATE TABLE users (
    userid SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    cnpj VARCHAR(14)
);
	
-- =============================================================================================

CREATE TABLE userMercado (
    user_mercado_id SERIAL PRIMARY KEY,
    nome_mercado VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255),
    access_token VARCHAR(255),
    userid INTEGER NOT NULL,
    FOREIGN KEY (userid) REFERENCES users(userid)
);

CREATE TABLE userMagalu (
    user_magalu_id SERIAL PRIMARY KEY,
    nome_magalu VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255),
    access_token VARCHAR(255),
    userid INTEGER NOT NULL,
    FOREIGN KEY (userid) REFERENCES users(userid)
);

CREATE TABLE userShopee (
    user_shop_id BIGINT PRIMARY KEY,
    nome_shopee VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255),
    access_token VARCHAR(255),
    userid INTEGER NOT NULL,
    FOREIGN KEY (userid) REFERENCES users(userid)
);

-- ==============================================================================================

CREATE TABLE productsMercado (
    product_sku VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    pictureUrls TEXT NOT NULL,
    color VARCHAR(50),
    diameter VARCHAR(50),
    available_quantity INTEGER,
    userid INTEGER NOT NULL,
    date_created TIMESTAMP,
    last_updated TIMESTAMP,
    listing VARCHAR(50),
    condition VARCHAR(50),
    description TEXT,
    video_id VARCHAR(255),
    warrantyType VARCHAR(50),
    warrantyTemp VARCHAR(50),
    brand VARCHAR(50),
    gtin VARCHAR(50),
    UNIQUE (product_sku, userid),  -- cada usuário (userid) pode ter múltiplos produtos (product_sku), mas não pode ter duplicatas do mesmo product_sku
    FOREIGN KEY (userid) REFERENCES users(userid)
);

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at column on update
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON productsMercado
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================================

-- VER AS CHAVES ESTRANGEIRAS DO STOCK

CREATE TABLE stock (
    SKU VARCHAR(55) PRIMARY KEY,
    Nome_do_Produto VARCHAR(255),
    Apelido_do_Produto VARCHAR(255),
    Categorias VARCHAR(255),
    Codigo_de_Barras VARCHAR(50),
    Data_de_Lancamento DATE,
    Status_da_Venda VARCHAR(10) CHECK (Status_da_Venda IN ('Ativo', 'Inativo')),
    Vendedor VARCHAR(100),
    Preco_de_Varejo DECIMAL(10, 2),
    Custo_de_Compra DECIMAL(10, 2),
    Descricao TEXT,
    Link_do_Fornecedor VARCHAR(255),
    Marca VARCHAR(100),
    Tamanho VARCHAR(50),
    Peso_do_Pacote DECIMAL(10, 2),
    Tamanho_de_Embalagem VARCHAR(50),
    Link_do_Video VARCHAR(255),
    NCM VARCHAR(20),
    CEST VARCHAR(20),
    Unidade VARCHAR(10),
    Origem VARCHAR(50),
    quantidade INTEGER,
    transito INTEGER,
    disponivel INTEGER,
    quantidade_total INTEGER,
    skuMercado VARCHAR(50),
    userid INTEGER NOT NULL,
    FOREIGN KEY (userid) REFERENCES users(userid)
    -- UNIQUE (SKU, userid) -- Adiciona esta linha se quiser garantir a unicidade da combinação SKU e userid
);

CREATE TABLE stockVariant (
    SPU INT PRIMARY KEY,
    SKU VARCHAR(255),
    Nome_do_Produto VARCHAR(255),
    Apelido_do_Produto VARCHAR(100),
    Categorias VARCHAR(255),
    Codigo_de_Barras VARCHAR(50),
    Data_de_Lancamento DATE,
    Status_da_Venda VARCHAR(10) CHECK (Status_da_Venda IN ('Ativo', 'Inativo')),
    Vendedor VARCHAR(100),
    Preco_de_Varejo DECIMAL(10, 2),
    Custo_de_Compra DECIMAL(10, 2),
    Descricao TEXT,
    Link_do_Fornecedor VARCHAR(255),
    Marca VARCHAR(100),
    Tamanho VARCHAR(50),
    Cor VARCHAR(50),
    Adicionar VARCHAR(255),
    Peso_do_Pacote DECIMAL(10, 2),
    Tamanho_de_Embalagem VARCHAR(50),
    Link_do_Video VARCHAR(255),
    NCM VARCHAR(20),
    CEST VARCHAR(20),
    Unidade VARCHAR(10),
    Origem VARCHAR(50),
    quantidade INTEGER,
    transito INTEGER,
    disponivel INTEGER,
    quantidade_total INTEGER,
    userid INTEGER NOT NULL,
    FOREIGN KEY (userid) REFERENCES users(userid)
);

CREATE TABLE stockKit (
    SKUKIT VARCHAR(55) PRIMARY KEY,
    SKU VARCHAR(255) NOT NULL,
    Nome_do_Produto VARCHAR(255),
    Apelido_do_Produto VARCHAR(255),
    Categorias VARCHAR(255),
    Custo_de_Compra DECIMAL(10, 2),
    Status_da_Venda VARCHAR(10) CHECK (Status_da_Venda IN ('Ativo', 'Inativo')),
    SkuMercado VARCHAR(50),
    quantidade INTEGER,
    userid INTEGER(100) NOT NULL,
    FOREIGN KEY (userid) REFERENCES usuarios(userid)
);

-- ==============================================================================================

CREATE TABLE ordersmercado (
    order_id VARCHAR(255),
    product_sku VARCHAR(255),
    reason VARCHAR(255),
    total_paid_amount NUMERIC,
    buyer_nickname VARCHAR(255),
    date_last_modified VARCHAR(90),
    total_amount NUMERIC,
    date_created TIMESTAMP,
    seller_nickname VARCHAR(255),
    status VARCHAR(255),
    substatus VARCHAR(255),
    status_simc VARCHAR(255),
    pack_id VARCHAR(255),
    quantity INTEGER,
    shipping_id VARCHAR(255),
    tracking_number VARCHAR(255),
    tracking_method VARCHAR(255),
    street_name VARCHAR(255),
    receiver_name VARCHAR(255),
    address_line VARCHAR(255),
    neighborhood VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    zip_code VARCHAR(50),
    country VARCHAR(255),
    pictureUrls TEXT,
    unit_price NUMERIC(10, 2),
    color_name VARCHAR(255),
    sale_fee NUMERIC,
    list_cost NUMERIC,
    invoice_id VARCHAR(255),
    invoice_key VARCHAR(255),
    userid INTEGER NOT NULL,
    FOREIGN KEY (userid) REFERENCES users(userid),
    FOREIGN KEY (product_sku) REFERENCES productsMercado(product_sku)
);

-- ==============================================================================================

CREATE TABLE itemVisitsMercado (
    userid INTEGER NOT NULL,
    date_from TIMESTAMP NOT NULL,
    date_to TIMESTAMP NOT NULL,
    total_visits INTEGER NOT NULL,
    conversion_rate NUMERIC(5, 2) NOT NULL,
    FOREIGN KEY (userid) REFERENCES users(userid)
);


-- ==============

CREATE TABLE companyInformation (
    cnpj VARCHAR(20) PRIMARY KEY,           -- CNPJ of the company, set as primary key
    serial_number INTEGER,                  -- Serial number
    company_name VARCHAR(255) NOT NULL,     -- Name of the company
    tax_type VARCHAR(50),                   -- Type of taxation
    company_type VARCHAR(50),               -- Type of the company (e.g., MEI, Ltda, etc.)
    state_registration VARCHAR(50),         -- State Registration (Inscrição Estadual)
    email VARCHAR(255) NOT NULL,            -- Email of the company
    postal_code VARCHAR(10),                -- Postal code (CEP)
    address VARCHAR(255),                   -- Address of the company
    address_number VARCHAR(10),             -- Address number
    neighborhood VARCHAR(100),              -- Neighborhood
    city VARCHAR(100),                      -- City
    state VARCHAR(2),                       -- State (e.g., SP, RJ)
    userid INTEGER NOT NULL,                -- User ID associated with the company
    FOREIGN KEY (userid) REFERENCES users(userid)
);

—------------------------------------------------------------------------------------------------------------------------
