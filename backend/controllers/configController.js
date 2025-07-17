import pool from '../bd.js';
import { getUserId } from '../utils/verifyToken.js';

const validaToken = async () => {
    const userid = getUserId();

    const result = await pool.query(`SELECT access_token FROM usermercado WHERE userid = ${userid}`);

    if (result.rows.length > 0) {
        const accessToken = result.rows[0].access_token;
        return accessToken;
    } else {
        throw new Error('Usuário não encontrado ou token não definido');
    }
}

const validaIdUserMercado = async () => {
    const userid = getUserId();

    const result = await pool.query(`SELECT user_mercado_id FROM usermercado WHERE userid = ${userid}`);

    if (result.rows.length > 0) {
        const user_mercado_ids = result.rows.map(row => row.user_mercado_id);
        return user_mercado_ids;
    } else {
        throw new Error('Usuário não encontrado ou token não definido');
    }
}

export async function createCompanyInformation (req, res) {
    try {
        const userid = getUserId(); // Assuming this function fetches the logged-in user's ID.
        const {
            cnpj,
            serial_number,
            company_name,
            tax_type,
            company_type,
            state_registration,
            email,
            postal_code,
            address,
            address_number,
            neighborhood,
            city,
            state
        } = req.body;

        // Insert company information into the database, including serial_number which will auto-increment
        const query = `
            INSERT INTO companyInformation (
                cnpj, 
                serial_number,
                company_name, 
                tax_type, 
                company_type, 
                state_registration, 
                email, 
                postal_code, 
                address, 
                address_number, 
                neighborhood, 
                city, 
                state, 
                userid
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            )
            RETURNING *;
        `;

        const values = [
            cnpj,
            serial_number,
            company_name,
            tax_type,
            company_type,
            state_registration,
            email,
            postal_code,
            address,
            address_number,
            neighborhood,
            city,
            state,
            userid
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            message: 'Company information added successfully.',
            company: result.rows[0] // The serial_number will also be included in the returned rows
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to add company information to the database.' });
    }
};