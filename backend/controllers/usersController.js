import pool from '../bd.js';

export async function getAllUsers (req, res) {
    try {
        const users = await pool.query('SELECT * FROM users');
        res.status(200).json(users.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Erro ao buscar usuários.' });
    }
};

export async function getUserById (req, res) {
    try {
        const { id } = req.params;
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (user.rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });

        res.status(200).json(user.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Erro ao buscar o usuário.' });
    }
};

export async function updateUser (req, res) {
    try {
        const { id } = req.params;
        const { email, senha, data_nascimento, telefone, cnpj } = req.body;

        await pool.query(
            'UPDATE users SET email = $1, senha = $2, data_nascimento = $3, telefone = $4, cnpj = $5 WHERE id = $6',
            [email, senha, data_nascimento, telefone, cnpj, id]
        );

        res.status(200).json({ message: 'Usuário atualizado com sucesso.' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Erro ao atualizar o usuário.' });
    }
};

export async function deleteUser (req, res) {
    try {
        const { id } = req.params;

        await pool.query('DELETE FROM users WHERE id = $1', [id]);

        res.status(200).json({ message: 'Usuário excluído com sucesso.' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Erro ao excluir o usuário.' });
    }
};
