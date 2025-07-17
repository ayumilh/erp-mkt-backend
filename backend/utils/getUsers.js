import dotenv from 'dotenv';
import pool from '../bd.js';
import { getUserId } from './verifyToken.js';

dotenv.config();

export async function getUserIdBd(req, res) {
  try {
    // Obtém o ID do usuário a partir do token (ou variável global)
    const userid = parseInt(getUserId(), 10);
    console.log('UserID obtido:', userid);

    const { rows } = await pool.query(
      'SELECT * FROM users WHERE userid = $1',
      [userid]
    );

    return res.status(200).json({ user: rows });
  } catch (error) {
    console.error('Erro ao recuperar usuário do banco:', error);
    return res
      .status(500)
      .json({ message: 'Erro ao recuperar os Users do banco de dados.' });
  }
}
