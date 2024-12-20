const dotenv = require('dotenv');
dotenv.config();
const pool = require('../bd.js');
const { GetUserId } = require('./verifyToken.js');


//Get User por Id no Banco
const getUserIdBd = async (req, res) => {
    try {
        const userid = parseInt(GetUserId()); // Supondo que você tenha uma função para obter o ID do usuário
        console.log(userid)
        const user = await pool.query('SELECT * FROM users WHERE userid = $1', [userid]);

        res.status(200).json({ user: user.rows });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar os Users do banco de dados.' });
    }
};


module.exports = {
    getUserIdBd,
};
