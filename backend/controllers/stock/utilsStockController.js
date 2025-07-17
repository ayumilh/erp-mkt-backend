import pool from '../../bd.js'
import { getUserId } from '../../utils/verifyToken.js'



export async function getProductByIdSKU (req, res) {
    const userid = getUserId();
    const sku = req.params.sku; // Supondo que o SKU seja passado como parâmetro na URL

    try {
        const result = await pool.query(
            `SELECT * FROM stock WHERE userid = $1 AND SKU = $2`,
            [userid, sku]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('Produto não encontrado.');
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao obter o produto:', error);
        res.status(500).send('Erro interno do servidor.');
    }
};

// search Products Adicionar SKU Estoque
export async function searchProducts (req, res) {
    const userid = getUserId();
    const { searchQuery } = req.query; // Parâmetro de consulta para o critério de busca

    try {
        let query = `SELECT SKU, nome_do_produto FROM stock WHERE userid = $1`;

        // Se houver uma consulta de busca, adicione à consulta SQL
        if (searchQuery) {
            query += ` AND (SKU = $2 OR nome_do_produto ILIKE $3)`;
        }

        const params = [userid];
        if (searchQuery) {
            params.push(searchQuery, `%${searchQuery}%`);
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar itens do estoque:', error);
        res.status(500).send('Erro interno do servidor.');
    }
};

// let tempSKU = null;

// // Rota para Enviar o SKU do Produto do Estoque
// const postProductStockSpecific = async (req, res) => {  
//     try {
//         // Recebendo SKU do frontend
//         const SKU = req.body.SKU;
//         console.log('SKU armazenado temporariamente:', SKU);

//         // Convertendo o SKU para um número inteiro e armazenando temporariamente
//         tempSKU = parseInt(SKU);

//         res.status(200).json({ message: `SKU armazenado temporariamente: ${SKU}` });
//     } catch (error) {
//         console.error('Erro:', error);
//         res.status(500).json({ message: 'Erro ao processar a solicitação.' });
//     }
// };

// Puxar o Produto depois de Salvar na hora de Selecionar em Adicionar SKU (Kit Estoque)
export async function getProductSolo (req, res) {
    try {
  
        const userid = getUserId(); 
        const SKUs = req.query.idProduct;

        // Verificar se foram fornecidos SKUs na requisição
        if (!SKUs || SKUs.length === 0) {
            return res.status(400).json({ message: 'SKUs não encontrados.' });
        }

        // Inicializar um array para armazenar os resultados das consultas
        const results = [];

        // Consultar o banco de dados para cada SKU na lista
        for (let i = 0; i < SKUs.length; i++) {
            const SKU = SKUs[i];
            const result = await pool.query(`SELECT SKU, custo_de_compra, quantidade FROM stock WHERE userid = $1 AND SKU = $2`, [userid, SKU]);
            results.push(result.rows[0]); 
        }

        // Retornar os resultados das consultas
        res.json(results);
    } catch (error) {
        console.error('Erro ao obter itens do estoque:', error);
        res.status(500).send('Erro interno do servidor.');
    }
};


// Sincronização do Estoque com Plataforma
const syncStock = async (req, res) => {
    try {
        // Usar o SKU temporariamente armazenado
        const userid = getUserId(); 
        const quantidade = req.body.quantidade;
        const transito = req.body.transito;
        const disponivel = req.body.disponivel;
        const quantidade_total = req.body.quantidade_total;

    } catch (error) {
        console.error('Erro ao obter itens do estoque:', error);
        res.status(500).send('Erro interno do servidor.');
    }
};
