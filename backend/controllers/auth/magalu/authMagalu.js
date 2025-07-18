import dotenv from "dotenv";
dotenv.config();

import pool from "../../../bd.js";

const clientId = process.env.CLIENT_ID_MAGALU;
const clientSecret = process.env.CLIENT_SECRET_MAGALU;
const redirectUri = process.env.REDIRECT_URI_MAGALU;


// PASSO 1
export async function magaluAuth (req, res) {
    try {
        //recebendo code do front end
        const code = req.body.code;
        const userid = req.user?.id;

        const response = await fetch('https://id.magalu.com/oauth/token', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "client_id": clientId,
                "client_secret": clientSecret,
                "redirect_uri": redirectUri,
                "code": code,
                "grant_type": "authorization_code"
            })
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
        const refresh_token = tokenData.refresh_token;
        const access_token = tokenData.access_token;
        console.log(`Refresh Token: ${refresh_token}  Access Token: ${access_token}`);

        // Inserir o refresh_token na tabela userMagalu junto com o ID do usuário
        await pool.query(
            'INSERT INTO userMagalu (nome_magalu, refresh_token, access_token, userid) VALUES ($1, $2, $3, $4)',
            ['loja teste2', refresh_token,access_token, userid]
        );

        res.status(200).json({ message: 'Refresh token salvo com sucesso.' });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao processar a solicitação.' });
    }
};
