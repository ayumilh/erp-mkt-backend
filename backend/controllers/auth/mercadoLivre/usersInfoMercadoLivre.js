const pool = require('../../../bd.js');
const { GetUserId } = require('../../../utils/verifyToken.js');
const { startOfDay, endOfDay, formatISO } = require('date-fns');

const validaToken = async (userid) => {

    const result = await pool.query(`SELECT access_token FROM usermercadolivre WHERE userid = ${userid}`);

    if (result.rows.length > 0) {
        const accessToken = result.rows[0].access_token;
        return accessToken;
    } else {
        throw new Error('Usuário não encontrado ou token não definido');
    }
}

const validaIdUserMercado = async (userid) => {

    const result = await pool.query(`SELECT user_mercado_id FROM usermercadolivre WHERE userid = ${userid}`);

    if (result.rows.length > 0) {
        const user_mercado_ids = result.rows.map(row => row.user_mercado_id);
        return user_mercado_ids;
    } else {
        throw new Error('Usuário não encontrado ou token não definido');
    }
}

const mercadoLivreVisitsSync = async (req, res) => {
    try {
        const userid = req.body.userId;
        const access_token = await validaToken(userid);
        const userMercado = await validaIdUserMercado(userid); // Puxando id Mercado User

        const now = new Date();
        const date_from = startOfDay(now).toISOString().replace('Z', '-00:00');
        const date_to = endOfDay(now).toISOString().replace('Z', '-00:00');

        console.log('UserID:', userid);
        console.log('Access Token:', access_token);
        console.log('Date From:', date_from);
        console.log('Date To:', date_to);

        if (!userid || !access_token) {
            throw new Error('User ID or Access Token is missing.');
        }

        const response = await fetch(`https://api.mercadolibre.com/users/${userMercado}/items_visits?date_from=${date_from}&date_to=${date_to}`, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Full error response:', errorData);
            let errorMessage = 'Error fetching item visits';
            if (errorData && errorData.error_description) {
                errorMessage = errorData.error_description;
            }
            throw new Error(errorMessage);
        }

        const visitsData = await response.json();
        console.log('Visits Data:', visitsData);

        const totalVisits = visitsData.total_visits;

        const ordersQuery = `
            SELECT COUNT(*) AS total_orders
            FROM ordersmercado
            WHERE userid = $1 AND date_created BETWEEN $2 AND $3
        `;
        const ordersResult = await pool.query(ordersQuery, [userid, date_from, date_to]);
        const totalOrders = parseInt(ordersResult.rows[0].total_orders, 10);

        const conversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;

        const existingVisit = await pool.query('SELECT * FROM itemVisitsMercado WHERE user_id = $1 AND date_from = $2 AND date_to = $3', [userid, date_from, date_to]);

        if (existingVisit.rows.length > 0) {
            const updateQuery = `
                UPDATE itemVisitsMercado SET
                total_visits = $1,
                conversion_rate = $2
                WHERE user_id = $3 AND date_from = $4 AND date_to = $5
            `;
            const updateValues = [totalVisits, conversionRate, userid, date_from, date_to];

            await pool.query(updateQuery, updateValues);
        } else {
            const insertQuery = `
                INSERT INTO itemVisitsMercado (
                    user_id, date_from, date_to, total_visits, conversion_rate
                ) VALUES ($1, $2, $3, $4, $5)
            `;
            const insertValues = [userid, date_from, date_to, totalVisits, conversionRate];

            await pool.query(insertQuery, insertValues);
        }

        res.status(200).json({ message: 'Item visits updated successfully.', conversion_rate: conversionRate });

    } catch (error) {
        console.error('Error fetching item visits:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get Item Visits - Visitas de Itens
const mercadoLivreGetItemVisits = async (req, res) => {
    try {
        // Obter user_id do GetUserId
        const userid = req.body.userId;
        

        // Definir date_from e date_to como o intervalo de data atual
        const now = new Date();
        const date_from = startOfDay(now).toISOString().replace('Z', '-00:00');

        // Consultar visitas de itens
        const visits = await pool.query(
            `SELECT * FROM itemVisitsMercado 
             WHERE user_id = $1 
             AND date_from >= $2 
             ORDER BY date_from DESC`,
            [userid, date_from]
        );

        // Retornar os dados das visitas
        res.status(200).json({ visits: visits.rows });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar as visitas de itens do banco de dados.' });
    }
};


module.exports = {
    mercadoLivreVisitsSync,
    mercadoLivreGetItemVisits
};

