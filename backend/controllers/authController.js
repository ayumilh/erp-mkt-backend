const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../bd.js');
const dotenv = require('dotenv');
dotenv.config();

const secretKey = process.env.JWT; // Chave secreta para assinar o token JWT

exports.register = async (req, res) => {
    try {
        const { email, senha, telefone, cnpj } = req.body;

        // Verifique se todos os campos obrigatórios foram fornecidos
        if (!email || !senha) {
            return res.status(400).json({ message: 'Por favor, forneça todos os campos obrigatórios.' });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);

        await pool.query(
            'INSERT INTO users (email, senha, telefone, cnpj) VALUES ($1, $2, $3, $4)',
            [email, hashedPassword, telefone, cnpj]
        );

        res.status(201).json({ message: 'Usuário registrado com sucesso.' });
    } catch (error) {
        console.error('Erro ao registrar o usuário:', error);
        res.status(500).json({ message: 'Erro ao registrar o usuário.' });
    }
};
 
exports.login = async (req, res) => {
    try {
        const { email, senha, googleLogin } = req.body;

        // Verificação se e-mail foi fornecido
        if (!email) {
            return res.status(400).json({ message: 'Por favor, forneça um email.' });
        }

        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Verifica se o login é através do Google
        if (!googleLogin) {
            // Verificação se senha foi fornecida
            if (!senha) {
                return res.status(400).json({ message: 'Por favor, forneça uma senha.' });
            }

            const passwordMatch = await bcrypt.compare(senha, user.rows[0].senha);
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Credenciais inválidas.' });
            }
        }

        const token = jwt.sign({ userid: user.rows[0].userid }, secretKey, { expiresIn: '1h' });

        res.cookie('token', token, { 
            httpOnly: true,
            secure: true, // Apenas enviar o cookie através de conexões HTTPS
            sameSite: 'strict', // Prevenir ataques CSRF
            maxAge: 24 * 60 * 60 * 1000 // Tempo de expiração do cookie em milissegundos (1 dia)
        });
        
        res.status(200).json({ auth: true, token: token });
    } catch (error) {
        console.error('Erro ao fazer login:', error.message);
        res.status(500).json({ message: 'Erro ao fazer login.' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { email, senha, novaSenha } = req.body;

        // Verificação se os campos obrigatórios foram fornecidos
        if (!email || !senha || !novaSenha) {
            return res.status(400).json({ message: 'Por favor, forneça email, senha atual e nova senha.' });
        }

        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const passwordMatch = await bcrypt.compare(senha, user.rows[0].senha);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Senha atual incorreta.' });
        }

        const hashedNewPassword = await bcrypt.hash(novaSenha, 10);

        await pool.query(
            'UPDATE users SET senha = $1 WHERE email = $2',
            [hashedNewPassword, email]
        );

        res.status(200).json({ message: 'Senha atualizada com sucesso.' });
    } catch (error) {
        console.error('Erro ao alterar senha:', error.message);
        res.status(500).json({ message: 'Erro ao alterar senha.' });
    }
};