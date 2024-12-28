const pool = require('../../../bd.js');
const { GetUserId } = require('../../../utils/verifyToken.js');
const { format, startOfDay, subDays } = require('date-fns');
const JSZip = require('jszip')
const archiver = require('archiver');

const validaToken = async (userid) => {

    const result = await pool.query(`SELECT access_token FROM usermercado WHERE userid = ${userid}`);

    if (result.rows.length > 0) {
        const accessToken = result.rows[0].access_token;
        return accessToken;
    } else {
        throw new Error('Usuário não encontrado ou token não definido');
    }
}

const validaIdUserMercado = async (userid) => {

    const result = await pool.query(`SELECT user_mercado_id FROM usermercado WHERE userid = ${userid}`);

    if (result.rows.length > 0) {
        const user_mercado_ids = result.rows.map(row => row.user_mercado_id);
        return user_mercado_ids;
    } else {
        throw new Error('Usuário não encontrado ou token não definido');
    }
}



const downloadInvoices = async (req, res) => {
    try {
        const userid = req.body.userId;
        const { start, end } = req.body;

        const userMercado = await validaIdUserMercado(userid);
        const access_token = await validaToken(userid);

        // Verifica se start e end são inteiros válidos
        const startInt = parseInt(start, 10);
        const endInt = parseInt(end, 10);

        if (isNaN(startInt) || isNaN(endInt)) {
            return res.status(400).json({ error: 'Start and end dates must be valid integers.' });
        }

        // Verifica os parâmetros e constrói a URL
        console.log(`Solicitando faturas do período: start=${startInt}, end=${endInt}`);
        const url = `https://api.mercadolibre.com/users/${userMercado}/invoices/sites/MLB/batch_request/period/stream?start=${startInt}&end=${endInt}`;
        
        const maxRetries = 5;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                console.log(`Tentativa ${attempt + 1} de solicitação à API`);
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${access_token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    if (response.status === 429) {
                        // Taxa limitada, vai tentar novamente após atraso
                        const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
                        console.log(`Taxa limitada, tentando novamente após ${retryAfter} segundos...`);
                        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    } else {
                        let errorMessage = `Erro ao solicitar as faturas (Status: ${response.status})`;
                        if (errorData) {
                            errorMessage += `: ${errorData}`;
                        }
                        console.error(errorMessage);
                        throw new Error(errorMessage);
                    }
                } else {
                    // Sucesso
                    const invoicesData = await response.arrayBuffer(); // Tratando como dados binários

                    // Criando uma estrutura de pastas para segmentar arquivos no diretório /tmp
                    const fs = require('fs');
                    const path = require('path');

                    const outputFolder = path.join('/tmp', 'emitidas_mercado_livre');
                    if (!fs.existsSync(outputFolder)) {
                        fs.mkdirSync(outputFolder);
                    }

                    const filePath = path.join(outputFolder, `invoices_${startInt}_to_${endInt}.zip`);
                    fs.writeFileSync(filePath, Buffer.from(invoicesData));

                    console.log('Faturas baixadas e salvas em:', filePath);

                    // Processando o arquivo para download
                    res.setHeader('Content-Disposition', `attachment; filename="invoices_${startInt}_to_${endInt}.zip"`);
                    res.setHeader('Content-Type', 'application/zip');
                    
                    // Certificando de que o caminho do arquivo esteja acessível
                    res.sendFile(filePath, (err) => {
                        if (err) {
                            console.error('Erro ao enviar o arquivo para download:', err);
                            res.status(500).json({ error: 'Erro ao processar a solicitação de faturas.' });
                        }
                    });

                    return;
                }
            } catch (error) {
                attempt++;
                console.error(`Tentativa ${attempt} falhou:`, error);
                if (attempt >= maxRetries) {
                    return res.status(500).json({ error: 'Erro ao processar a solicitação de faturas.' });
                }
                // Opcional: Atraso antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: error.message });
    }
};


const mercadoLivreProcessNotes = async (req, res) => {
    try {
        const access_token = await validaToken();
        const userMercado = await validaIdUserMercado();
        const userid = GetUserId();

        // const status = 'ready_to_ship';
        // const substatus = 'printed';

        // const ordersMercado = await pool.query(
        //     'SELECT order_id FROM ordersMercado WHERE userid = $1 AND status = $2 AND substatus = $3 ORDER BY date_created DESC',
        //     [userid, status, substatus]
        // );

        const ordersMercado = await pool.query(
            `SELECT * FROM ordersMercado 
             WHERE userid = $1 
             AND (status = $2 OR (status = $3 AND substatus = $4)) 
             ORDER BY date_created DESC`,
            [userid, 'shipped', 'ready_to_ship', 'picked_up']
        );

        const orderIds = ordersMercado.rows.map(order => order.order_id);

        for (const orderId of orderIds) {
            const response = await fetch(`https://api.mercadolibre.com/users/${userMercado}/invoices/orders/${orderId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            if (!response.ok) {
                console.error(`Failed to fetch order ${orderId}:`, response.statusText);
            } else {
                const data = await response.json();
                console.log(`Fetched data for order ${orderId}:`, data);
            }
        }

        res.status(200).json({ message: 'Notas processadas com sucesso.' });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao processar as notas dos pedidos.' });
    }
};

const getSyncInvoices = async (req, res) => {
    try {
        const userid = req.body.userId;
        const access_token = await validaToken(userid);
        const userMercado = await validaIdUserMercado(userid);

        // Define o início do dia atual e o início do dia de 10 dias atrás
        const currentDate = startOfDay(new Date());
        const tenDaysAgo = startOfDay(subDays(currentDate, 9)); // Inclui os últimos 10 dias, contando o atual

        // Formata as datas para o formato ISO
        const firstDay = format(tenDaysAgo, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        const lastDay = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

        // Consulta SQL para selecionar pedidos que atendem aos critérios especificados
        const query = `
            SELECT order_id 
            FROM ordersMercado
            WHERE date_created BETWEEN $1 AND $2
            AND status_simc != 'issue'
            AND substatus != 'invoice_pending'
            AND userid = $3
        `;

        const result = await pool.query(query, [firstDay, lastDay, userId]);

        // Se nenhum pedido for encontrado, retorna uma resposta informando que não há dados
        if (result.rows.length === 0) {
            return res.status(200).json({ message: 'Nenhum pedido pendente encontrado nos últimos 10 dias.' });
        }

        // Itera pelos pedidos obtidos e realiza a requisição fetch para cada pedido
        for (const row of result.rows) {
            const orderId = row.order_id;

            // Prepara a URL da API do Mercado Livre com o ID do pedido atual
            const apiUrl = `https://api.mercadolibre.com/users/${userMercado}/invoices/orders/${orderId}`;

            try {
                // Envia a requisição fetch para a API do Mercado Livre
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${access_token}`, 
                        'Content-Type': 'application/json',
                    },
                });

                // Verifica se a resposta foi bem-sucedida
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`Erro ao buscar nota fiscal para o pedido ${orderId}:`, errorData);
                    continue; // Pula para o próximo pedido se houver um erro
                }

                // Loga os dados da nota fiscal obtidos para cada pedido
                const invoiceData = await response.json();
                console.log(`Nota fiscal obtida para o pedido ${orderId}:`, invoiceData);

                // Extrai invoice_id e invoice_key da resposta
                const invoice_id = invoiceData.items[0].invoice_id; // Acessa o invoice_id no primeiro item da lista de 'items'
                const invoice_key = invoiceData.attributes.invoice_key; // Acessa o invoice_key nos atributos da nota fiscal

                // Atualiza o invoice_id e invoice_key na tabela ordersMercado
                const updateQuery = `
                    UPDATE ordersMercado
                    SET invoice_id = $1, invoice_key = $2
                    WHERE order_id = $3 AND userid = $4
                `;
                await pool.query(updateQuery, [invoice_id, invoice_key, orderId, userId]);

            } catch (error) {
                // Lida com erros de fetch de forma adequada
                console.error(`Erro no fetch para o pedido ${orderId}:`, error.message);
            }
        }

        // Responde com uma mensagem de sucesso após processar todos os pedidos
        res.status(200).json({ message: 'Notas fiscais obtidas e atualizadas para todos os pedidos relevantes.' });

    } catch (error) {
        // Lida com quaisquer erros que ocorram durante o processamento do banco de dados ou da requisição geral
        console.error('Erro:', error);
        res.status(500).json({ error: error.message });
    }
};

const getInvoices = async (req, res) => {
    try {
        const userid = req.query.userId;

        // Consulta SQL ajustada para selecionar apenas registros onde invoice_key não é nulo ou vazio
        const query = `
            SELECT 
                invoice_id AS numero,
                invoice_key AS chave,
                'normal' AS tipo,
                receiver_name AS cliente,
                total_paid_amount AS Valor_Nota_Fisc,
                pack_id AS pedido,
                'em and' AS tempo,
                'emitido' AS estado
            FROM ordersMercado
            WHERE userid = $1 
              AND invoice_key IS NOT NULL 
              AND invoice_key != ''
            ORDER BY date_created DESC
        `;

        // Executa a consulta SQL com o parâmetro do userid
        const result = await pool.query(query, [userid]);

        // Retorna os registros encontrados
        res.status(200).json({ orders: result.rows });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar as notas fiscais aprovadas do banco de dados.' });
    }
};


module.exports = {
    downloadInvoices,
    mercadoLivreProcessNotes,
    getSyncInvoices,
    getInvoices
};