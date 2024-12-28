const cron = require('node-cron');
const pool = require('../bd.js');
const dotenv = require('dotenv');
dotenv.config();

const clientId_magalu = process.env.CLIENT_ID_MAGALU;
const clientSecret_magalu = process.env.CLIENT_SECRET_MAGALU;


//REFRESH TOKEN MERCADO LIVRE
async function atualizarRefreshTokenMercadoLivre() {
    try {
        // Buscar todos os registros da tabela usermercado
        const queryResult = await pool.query('SELECT user_mercado_id, refresh_token, access_token FROM usermercado');

        // Iterar sobre os resultados e atualizar cada refresh token
        for (const row of queryResult.rows) {
            const refreshToken = row.refresh_token;
            const accessToken = row.access_token;
            console.log(refreshToken)
            console.log(accessToken)

            // Fazer solicitação para atualizar o token
            const response = await fetch('https://api.mercadolibre.com/oauth/token', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: `grant_type=refresh_token&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&refresh_token=${refreshToken}`
            });


            if (response.ok) {
                const responseData = await response.json();
                const updatedRefreshToken = responseData.refresh_token;
                const updatedAccessToken = responseData.access_token;

                // Atualizar o refresh token no banco de dados
                await pool.query('UPDATE usermercado SET refresh_token = $1, access_token = $2 WHERE user_mercado_id = $3', [updatedRefreshToken, updatedAccessToken, row.user_mercado_id]);
                console.log('Refresh Token Atualizado Mercado Livre >>', updatedRefreshToken + ' Access Token:', updatedAccessToken)
            } else {
                const errorData = await response.json(); // Tenta extrair informações do corpo da resposta
                let errorMessage = 'Erro na solicitação do token Mercado Livre';
                if (errorData && errorData.error_description) {
                    errorMessage = errorData.error_description; // Se houver uma mensagem de erro na resposta, usar ela
                }
                throw new Error(errorMessage);
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar refresh tokens do Mercado Livre:', error);
    }
}

// =========================================================================================================================================================================//

//REFRESH TOKEN Magalu

async function atualizarRefreshTokenMagalu() {
    try {
        // Buscar todos os registros da tabela usermagalu
        const queryResult = await pool.query('SELECT user_magalu_id, access_token, refresh_token FROM usermagalu');

        // Iterar sobre os resultados e atualizar cada refresh token
        for (const row of queryResult.rows) {
            const refreshToken = row.refresh_token;
            const accessToken = row.access_token;
            console.log(refreshToken, accessToken)

            // Fazer solicitação para atualizar o token
            const response = await fetch('https://id.magalu.com/oauth/token', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "client_id": clientId_magalu,
                    "client_secret": clientSecret_magalu,
                    "refresh_token": refreshToken,
                    "grant_type": "refresh_token"
                })
            });

            if (response.ok) {
                const responseData = await response.json();
                const updatedRefreshToken = responseData.refresh_token;
                const updatedAccessToken = responseData.access_token;

                // Atualizar o refresh token no banco de dados
                await pool.query('UPDATE usermagalu SET refresh_token = $1, access_token = $2  WHERE user_magalu_id = $3', [updatedRefreshToken, updatedAccessToken, row.user_magalu_id]);
                console.log(`Refresh Token Atualizado Magalu>> ${updatedRefreshToken} Access Token>> ${updatedAccessToken}`)
            } else {
                const errorData = await response.json(); // Tenta extrair informações do corpo da resposta
                let errorMessage = 'Erro na solicitação do token Magalu';
                if (errorData && errorData.error_description) {
                    errorMessage = errorData.error_description; // Se houver uma mensagem de erro na resposta, usar ela
                }
                throw new Error(errorMessage);
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar refresh tokens do Magalu:', error);
    }
}

// Função para atualizar o refresh token da Shopee
async function atualizarRefreshTokenShopee() {
    try {
        // Buscar todos os registros que precisam de atualização de token
        const queryResult = await pool.query('SELECT user_shopee_id, refresh_token FROM user_shopee');

        // Iterar sobre cada registro e atualizar o refresh token
        for (const row of queryResult.rows) {
            const { refresh_token, user_shopee_id } = row;

            // Fazer a solicitação para atualizar o token
            const response = await fetch('https://partner.shopeemobile.com/api/v2/auth/access_token/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partner_id: process.env.SHOPEE_PARTNER_ID,
                    shop_id: process.env.SHOPEE_SHOP_ID,
                    refresh_token: refresh_token
                })
            });

            if (response.ok) {
                const responseData = await response.json();
                const updatedRefreshToken = responseData.refresh_token;
                const updatedAccessToken = responseData.access_token;

                // Atualizar o refresh token no banco de dados
                await pool.query(
                    'UPDATE user_shopee SET refresh_token = $1, access_token = $2 WHERE user_shopee_id = $3',
                    [updatedRefreshToken, updatedAccessToken, user_shopee_id]
                );

                console.log('Shopee Refresh Token Atualizado:', updatedRefreshToken, 'Access Token:', updatedAccessToken);
            } else {
                const errorData = await response.json();
                console.error('Erro na solicitação de token Shopee:', errorData.message || 'Erro desconhecido');
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar refresh tokens da Shopee:', error);
    }
}



//AGENDADOR DO REFRESH

// Agendar a execução da função a cada 5 horas
// cron.schedule('0 */1 * * *', () => {
//     console.log('Executando atualização de refresh tokens...');
//     atualizarRefreshTokenMercadoLivre();
//     atualizarRefreshTokenMagalu();
// });

// A cada 1min para testes
// exports.cron.schedule('0 */3 * * *', () => {
//     console.log('Executando atualização de refresh tokens...');
//     atualizarRefreshTokenMercadoLivre();
//         // atualizarRefreshTokenMagalu();
//     });
     

// cron.schedule('0 * * * *', () => {
//     console.log('Executando atualização de refresh tokens da Shopee...');
//     atualizarRefreshTokenShopee();
// });

// A cada 1min para testes
// cron.schedule('*/1 * * * *', () => {
// console.log('Executando atualização de refresh tokens...');
// atualizarRefreshTokenMercadoLivre();
//     atualizarRefreshTokenShopee();
//     // atualizarRefreshTokenMagalu();
// });
 

