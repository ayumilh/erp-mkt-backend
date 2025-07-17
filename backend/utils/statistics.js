import pool from '../bd.js';
import { getUserId } from './verifyToken.js';

// Função para obter estatísticas de pedidos
export async function salesstatistics (req, res) {
    try {
        const userid = getUserId();
        const query = `
            SELECT 
                DATE(date_created) AS "Data",
                COUNT(order_id) AS "Total de Pedidos",
                SUM(total_paid_amount) AS "Valor Total de Vendas",
                COUNT(CASE WHEN status != 'cancelled' THEN 1 END) AS "Pedidos Válidos",
                SUM(CASE WHEN status != 'cancelled' THEN total_paid_amount ELSE 0 END) AS "Valor de Vendas Válidas",
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS "Pedidos Cancelados",
                SUM(CASE WHEN status = 'cancelled' THEN total_paid_amount ELSE 0 END) AS "Valor de Vendas Canceladas",
                COUNT(DISTINCT buyer_nickname) AS "Clientes",
                ROUND(SUM(total_paid_amount) / NULLIF(COUNT(DISTINCT buyer_nickname), 0), 2) AS "Vendas por Cliente"
            FROM 
                ordersmercado
            WHERE 
                userid = $1
            GROUP BY 
                DATE(date_created)
            ORDER BY 
                DATE(date_created) DESC;
        `;
        
        const orderStatistics = await pool.query(query, [userid]);
        res.status(200).json({ statistics: orderStatistics.rows });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar as estatísticas dos pedidos do banco de dados.' });
    }
};

export async function statisticsRealync (req, res) {
    try {
        const userid = GetUserId(); 
        const query = `
            SELECT 
                ped.date_created AS "Data de pedido",
                'Em And' AS "Status",
                ped.order_id AS "Pedido",
                'LENE MODAS' AS "Loja",
                ped.total_amount AS "Valor do Pedido",
                (ped.total_amount - (ped.total_amount * 0.20) - 3) AS "Receita",
                pro.price AS "Vendas de Produtos",
                ped.list_cost AS "Taxa de Frete Comprador",
                (ped.total_amount * 0.20 + 3) AS "Desconto e Subsídio",
                ((ped.total_amount * 0.20) - 3) AS "Comissão",
                '' AS "Taxa de Transação",
                '' AS "Taxa de Serviço",
                ped.sale_fee AS "Taxa do Frete",
                '0' AS "Taxa de ADS",
                '0' AS "Outra Taxa da Plataforma",
                '' AS "Reembolso do Comprador",
                'Em And' AS "Lucro",
                'Em and' AS "Margem de Lucro"
            FROM ordersmercado ped
            INNER JOIN productsmercado pro ON ped.product_sku = pro.product_sku
            WHERE ped.userid = $1
            ORDER BY ped.date_created DESC
        `;
        
        const ordersMercado = await pool.query(query, [userid]);
        res.status(200).json({ orders: ordersMercado.rows });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar os pedidos do banco de dados.' });
    }
};