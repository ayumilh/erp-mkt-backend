import dotenv from "dotenv";
import pool from "../../../bd.js";
import crypto from "crypto";


function generateSign(partnerId, path, timestamp, partnerKey) {
    const baseString = `${partnerId}${path}${timestamp}`;
    return crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');
}

const validaToken = async (userid) => {

    const result = await pool.query(`SELECT access_token FROM userShopee WHERE userid = ${userid}`);

    if (result.rows.length > 0) {
        const accessToken = result.rows[0].access_token;
        return accessToken;
    } else {
        throw new Error('Usuário não encontrado ou token não definido');
    }
}

const validaIdUserShopee = async (userid) => {

    const result = await pool.query(`SELECT user_shopee_id FROM userShopee WHERE userid = ${userid}`);

    if (result.rows.length > 0) {
        const user_shopee_ids = result.rows.map(row => row.user_shopee_id);
        return user_shopee_ids;
    } else {
        throw new Error('Usuário não encontrado ou token não definido');
    }
}


// Função para obter a lista de produtos da loja com sign
const obterListaDeProdutos = async (shopId, partnerId, accessToken) => {
    const path = '/api/v2/product/get_item_list';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = generateSign(partnerId, path, timestamp, partnerKey);

    const url = `https://partner.shopeemobile.com${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;
    const body = {
        shop_id: shopId,
        partner_id: partnerId,
        access_token: accessToken,
        timestamp,
        pagination_offset: 0,
        pagination_entries_per_page: 50,
        update_time_from: 0,
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao obter lista de produtos');
    }

    const data = await response.json();
    return data.response.item_list || [];
};

// Função para obter informações básicas dos produtos com sign
const obterInformacoesBaseProduto = async (shopId, partnerId, accessToken, itemIds) => {
    const path = '/api/v2/product/get_item_base_info';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = generateSign(partnerId, path, timestamp, partnerKey);

    const url = `https://partner.shopeemobile.com${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;
    const body = {
        shop_id: shopId,
        partner_id: partnerId,
        access_token: accessToken,
        timestamp,
        item_id_list: itemIds,
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao obter informações dos produtos');
    }

    const data = await response.json();
    return data.response.item || [];
};

// Função para obter informações extras dos produtos com sign
const obterInformacoesExtrasProduto = async (shopId, partnerId, accessToken, itemIds) => {
    const path = '/api/v2/product/get_item_extra_info';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = generateSign(partnerId, path, timestamp, partnerKey);

    const url = `https://partner.shopeemobile.com${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;
    const body = {
        shop_id: shopId,
        partner_id: partnerId,
        access_token: accessToken,
        timestamp,
        item_id_list: itemIds,
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao obter informações extras dos produtos');
    }

    const data = await response.json();
    return data.response.item || [];
};

// Função principal para sincronizar produtos com sign
export async function shopeeGetProductsSync (req, res) {
    try {
        const userId = req.user?.id;
        const partnerId = process.env.partnerIdShopee;
        const partnerKey = process.env.partnerKeyShopee;

        const accessToken = await validaToken(userId);
        const shopIds = await validaIdUserShopee(userId);

        for (const shopId of shopIds) {
            const productList = await obterListaDeProdutos(shopId, partnerId, accessToken);
            const itemIds = productList.map(item => item.item_id);

            if (itemIds.length === 0) {
                console.log(`No products found for user ${userId}`);
                continue;
            }

            const baseProducts = await obterInformacoesBaseProduto(shopId, partnerId, accessToken, itemIds);
            const extraProducts = await obterInformacoesExtrasProduto(shopId, partnerId, accessToken, itemIds);

            for (const product of baseProducts) {
                const extraInfo = extraProducts.find(extra => extra.item_id === product.item_id);

                const productDetails = {
                    item_id: product.item_id,
                    name: product.item_name,
                    price: product.price_info?.price || 'N/A',
                    stock: product.stock_info?.stock || 0,
                    status: product.item_status,
                    category: product.category_id,
                    views: extraInfo?.view_count || 0,
                    sales: extraInfo?.sales || 0,
                    likes: extraInfo?.like_count || 0,
                    user_id: userId,
                    shop_id: shopId,
                };

                const existingProduct = await pool.query(
                    'SELECT * FROM products_shopee WHERE item_id = $1 AND user_id = $2',
                    [productDetails.item_id, userId]
                );

                if (existingProduct.rows.length > 0) {
                    // Update existing product
                    await pool.query(
                        `
                        UPDATE products_shopee SET
                            name = $1, price = $2, stock = $3, status = $4,
                            category = $5, views = $6, sales = $7, likes = $8,
                            shop_id = $9, last_updated = NOW()
                        WHERE item_id = $10 AND user_id = $11
                        `,
                        [
                            productDetails.name, productDetails.price, productDetails.stock,
                            productDetails.status, productDetails.category,
                            productDetails.views, productDetails.sales,
                            productDetails.likes, productDetails.shop_id,
                            productDetails.item_id, userId,
                        ]
                    );
                } else {
                    // Insert new product
                    await pool.query(
                        `
                        INSERT INTO products_shopee (
                            item_id, name, price, stock, status, category,
                            views, sales, likes, shop_id, user_id,
                            date_created, last_updated
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
                        `,
                        [
                            productDetails.item_id, productDetails.name, productDetails.price,
                            productDetails.stock, productDetails.status, productDetails.category,
                            productDetails.views, productDetails.sales,
                            productDetails.likes, productDetails.shop_id, userId,
                        ]
                    );
                }
            }
        }

        res.status(200).json({ message: 'Products synchronized successfully!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error synchronizing products with Shopee.' });
    }
};
