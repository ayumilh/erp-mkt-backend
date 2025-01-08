const dotenv = require('dotenv');
dotenv.config();
const pool = require('../../../bd.js');
const {GetUserId}  = require('../../../utils/verifyToken.js');

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;



// PASSO 1
exports.redirectToMercadoLivreAuth = async (req, res) => {
    try {
        const encodedRedirectUri = encodeURIComponent(redirectUri);
        const mercadoLivreAuthUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirectUri}&prompt=login`;

        res.redirect(mercadoLivreAuthUrl);
    } catch (error) {
        console.error('Erro ao gerar URL de autenticação do Mercado Livre:', error);
        res.status(500).json({ message: 'Erro ao gerar URL de autenticação do Mercado Livre.' });
    }
};


// PASSO 2
exports.mercadoLivreAuth = async (req, res) => {
    try {
        //recebendo code do front end
        const { code, nome_loja: nome_mercado, userId: userid } = req.body;

        if (!code || !nome_mercado || !userid) {
            const missingParams = [];
            if (!code) missingParams.push('code');
            if (!nome_mercado) missingParams.push('nome_loja');
            if (!userid) missingParams.push('userId');
            return res.status(400).json({ 
                message: `Parâmetros ausentes: ${missingParams.join(', ')}`,
                received: {code, nome_mercado, userid}
            });
        }

        //estou mandando a Body do Passo 1 após pegar o URL CODE TOKEN do cliente ao autenticar-se
        const requestBodyPasso2 = `grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${redirectUri}&code_verifier=$CODE_VERIFIER`;

        const response = await fetch('https://api.mercadolibre.com/oauth/token', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: requestBodyPasso2
        });

        if (!response.ok) {
            const errorData = await response.json(); // Tenta extrair informações do corpo da resposta
            let errorMessage = 'Erro na solicitação do token';
            if (errorData && errorData.error_description) {
                errorMessage = errorData.error_description; // Se houver uma mensagem de erro na resposta, usar ela
            }
            throw new Error(errorMessage);
        }

        const tokenData = await response.json();
        const user_mercado_id = tokenData.user_id;
        const refresh_token = tokenData.refresh_token;
        const access_token = tokenData.access_token;
        console.log(`'User id Mercado Livre:' ${user_mercado_id} Refresh Token: ${refresh_token} Access Token: ${access_token}`);

        // Inserir o refresh_token na tabela usermercado junto com o ID do usuário
        await pool.query(
            'INSERT INTO usermercado (nome_mercado, refresh_token, userid, access_token, user_mercado_id) VALUES ($1, $2, $3, $4, $5)',
            [nome_mercado, refresh_token, userid, access_token, user_mercado_id]
        );

        res.status(200).json({ message: 'Refresh token salvo com sucesso.' });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao processar a solicitação.' });
    }
};
