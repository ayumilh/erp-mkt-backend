const dotenv = require('dotenv');
const pool = require('../../../bd.js');
const crypto = require('crypto');
dotenv.config();



// Função para gerar o sign HMAC-SHA256
function generateSign(partnerId, path, timestamp, partnerKey) {
    const baseString = `${partnerId}${path}${timestamp}`;
    return crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');
}

const shopeeAuth = async (req, res) => {
    try {
        const partnerId = Number(process.env.partnerIdShopee); // Converte para número
        const partnerKey = process.env.partnerKeyShopee;

        console.log(partnerId)

        const userId = req.body.userId;
        const code = req.body.code; // Código retornado após a autenticação
        const userShopId = req.body.shop_id; // ID da loja Shopee
        const nome_shopee = req.body.nome_loja;

        console.log(`userid: ${userId}  code: ${code} userShopId: ${userShopId}  nome_shopee: ${nome_shopee}`);

        if (!userShopId || !userId || !code || !nome_shopee) {
            return res.status(400).json({ message: 'Dados insuficientes na requisição.' });
        }

        // Verificar se o user_shopee_id já existe
        const existingShop = await pool.query(
            'SELECT 1 FROM userShopee WHERE user_shopee_id = $1',
            [userShopId]
        );

        if (existingShop.rowCount > 0) {
            return res.status(400).json({ message: 'Loja já registrada.' });
        }

        const timestamp = Math.floor(Date.now() / 1000); // Gerar timestamp atual
        const path = '/api/v2/auth/token/get';
        const sign = generateSign(partnerId, path, timestamp, partnerKey); // Gerar sign novamente

        const url = `https://partner.shopeemobile.com${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;

        const body = {
            code,
            shop_id: userShopId,
            partner_id: partnerId,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro na solicitação do token');
        }

        const tokenData = await response.json();
        console.log('Resposta da API da Shopee:', tokenData);
        const { access_token, refresh_token } = tokenData;

        if (!access_token || !refresh_token) {
            throw new Error('Tokens retornados pela API são inválidos.');
        }

        await pool.query(
            'INSERT INTO userShopee (user_shopee_id, nome_shopee, access_token, refresh_token, userid) VALUES ($1, $2, $3, $4, $5)',
            [userShopId, nome_shopee, access_token, refresh_token, userId]
        );

        res.status(200).json({ message: 'Tokens da Shopee salvos com sucesso.' });
    } catch (error) {
        console.error('Erro ao processar a solicitação:', error);
        res.status(500).json({ message: 'Erro ao processar a solicitação.' });
    }
};

module.exports = {
    shopeeAuth
};
