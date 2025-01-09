const pool = require('../../../bd.js');
const { GetUserId } = require('../../../utils/verifyToken.js');

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

//SYNC PEDIDOS MERCADO LIVRE
const mercadoLivreGetAllOrders = async (req, res) => {
    try {
        const userid = req.query.userId;
        const userMercado = await validaIdUserMercado(userid);
        const access_token = await validaToken(userid);

        console.log("Userid", userid)
        console.log("userMercado", userMercado)
        console.log("acess_token", access_token)

        const ordersData = [];

        for (const userMl of userMercado) {
            const response = await fetch(`https://api.mercadolibre.com/orders/search?seller=${userMl}&sort=date_desc`, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = 'Erro na solicitação do token';
                if (errorData && errorData.error_description) {
                    errorMessage = errorData.error_description;
                }
                throw new Error(errorMessage);
            }

            const orders = await response.json();
            // console.log("Pedidos recebidos da API do Mercado Livre:", orders.results); // Adiciona esta linha para mostrar os pedidos
            ordersData.push(...orders.results);
        }

        const data = ordersData.map(order => {
            return order.payments.map(payment => {
                const orderDetail = {
                    order_id: payment.order_id,
                    reason: payment.reason,
                    total_paid_amount: payment.total_paid_amount,
                    buyer_nickname: order.buyer.nickname,
                    date_last_modified: payment.date_last_modified,
                    total_amount: order.total_amount,
                    date_created: order.date_created,
                    seller_nickname: order.seller.nickname,
                    status: payment.status,
                    pack_id: order.pack_id,
                    quantity: order.order_items.reduce((acc, item) => acc + item.quantity, 0),
                    shipping_id: order.shipping.id,
                    shipping_data: null,
                    product_sku: order.order_items[0].item.id,
                    pictureUrls: null,
                    unit_price: order.order_items[0].unit_price,
                    sale_fee: order.order_items[0].sale_fee,
                    invoice_id: order.invoice_id,
                    invoice_key: order.invoice_key
                };

                const colors = order.order_items[0].item.variation_attributes
                    .filter(attr => attr.id === 'COLOR')
                    .map(attr => attr.value_name)
                    .join(', ');

                orderDetail.color_name = colors;

                return orderDetail;
            });
        }).flat();

        for (const orderDetail of data) {
            const productResponse = await fetch(`https://api.mercadolibre.com/items/${orderDetail.product_sku}`, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            if (!productResponse.ok) {
                const errorData = await productResponse.json();
                let errorMessage = 'Erro na solicitação do token';
                if (errorData && errorData.error_description) {
                    errorMessage = errorData.error_description;
                }
                throw new Error(errorMessage);
            }

            const productData = await productResponse.json();
            orderDetail.product_data = {
                pictureUrls: productData.pictures[0]?.url,
            };
            orderDetail.pictureUrls = productData.pictures[0]?.url;

            const shippingResponse = await fetch(`https://api.mercadolibre.com/shipments/${orderDetail.shipping_id}`, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            if (!shippingResponse.ok) {
                const errorData = await shippingResponse.json();
                let errorMessage = 'Erro na solicitação do token';
                if (errorData && errorData.error_description) {
                    errorMessage = errorData.error_description;
                }
                throw new Error(errorMessage);
            }

            const shippingData = await shippingResponse.json();
            console.log('shippingData:', shippingData);

            orderDetail.shipping_data = {
                tracking_number: shippingData.tracking_number,
                tracking_method: shippingData.tracking_method,
                street_name: shippingData.receiver_address.street_name,
                receiver_name: shippingData.receiver_address.receiver_name,
                address_line: shippingData.receiver_address.address_line,
                neighborhood: shippingData.receiver_address.neighborhood.name,
                city: shippingData.receiver_address.city.name,
                state: shippingData.receiver_address.state.name,
                zip_code: shippingData.receiver_address.zip_code,
                country: shippingData.receiver_address.country.id,
                status: shippingData.status,
                list_cost: shippingData.list_cost,
                substatus: shippingData.substatus,
                status_simc: ''
            };

            const existingOrder = await pool.query('SELECT * FROM ordersMercado WHERE order_id = $1 AND userid = $2', [orderDetail.order_id, userid]);

            if (existingOrder.rows.length > 0) {
                const updateQuery = `
                    UPDATE ordersMercado SET
                        reason = $1,
                        total_paid_amount = $2,
                        buyer_nickname = $3,
                        date_last_modified = $4,
                        total_amount = $5,
                        date_created = $6,
                        seller_nickname = $7,
                        status = $8,
                        pack_id = $9,
                        quantity = $10,
                        shipping_id = $11,
                        tracking_number = $12,
                        tracking_method = $13,
                        street_name = $14,
                        receiver_name = $15,
                        address_line = $16,
                        neighborhood = $17,
                        city = $18,
                        state = $19,
                        zip_code = $20,
                        country = $21,
                        product_sku = $22,
                        pictureUrls = $23,
                        unit_price = $24,
                        color_name = $25,
                        sale_fee = $26,
                        list_cost = $27,
                        substatus = $28
                    WHERE order_id = $29 AND userid = $30;
                `;

                const updateValues = [
                    orderDetail.reason, orderDetail.total_paid_amount, orderDetail.buyer_nickname,
                    orderDetail.date_last_modified, orderDetail.total_amount, orderDetail.date_created,
                    orderDetail.seller_nickname, orderDetail.shipping_data.status, orderDetail.pack_id, orderDetail.quantity,
                    orderDetail.shipping_id, orderDetail.shipping_data.tracking_number, orderDetail.shipping_data.tracking_method,
                    orderDetail.shipping_data.street_name, orderDetail.shipping_data.receiver_name,
                    orderDetail.shipping_data.address_line, orderDetail.shipping_data.neighborhood,
                    orderDetail.shipping_data.city, orderDetail.shipping_data.state,
                    orderDetail.shipping_data.zip_code, orderDetail.shipping_data.country,
                    orderDetail.product_sku, orderDetail.pictureUrls, orderDetail.unit_price,
                    orderDetail.color_name, orderDetail.sale_fee, orderDetail.shipping_data.list_cost,
                    orderDetail.shipping_data.substatus, orderDetail.order_id, userid
                ];

                await pool.query(updateQuery, updateValues);
            } else {

                const insertQuery = `
                    INSERT INTO ordersmercado (
                        order_id, product_sku, reason, total_paid_amount, buyer_nickname,
                        date_last_modified, total_amount, date_created, seller_nickname,
                        status, substatus, status_simc, pack_id, quantity, shipping_id,
                        tracking_number, tracking_method, street_name, receiver_name,
                        address_line, neighborhood, city, state, zip_code, country,
                        pictureUrls, unit_price, color_name, sale_fee, list_cost,
                        invoice_id, invoice_key, userid
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32);
                `;

                const values = [
                    orderDetail.order_id, orderDetail.product_sku, orderDetail.reason, orderDetail.total_paid_amount,
                    orderDetail.buyer_nickname, orderDetail.date_last_modified, orderDetail.total_amount,
                    orderDetail.date_created, orderDetail.seller_nickname, orderDetail.shipping_data.status,
                    orderDetail.substatus, orderDetail.shipping_data.status_simc, orderDetail.pack_id, orderDetail.quantity, orderDetail.shipping_id,
                    orderDetail.shipping_data.tracking_number, orderDetail.shipping_data.tracking_method, orderDetail.shipping_data.street_name, orderDetail.shipping_data.receiver_name,
                    orderDetail.shipping_data.address_line, orderDetail.shipping_data.neighborhood, orderDetail.shipping_data.city, orderDetail.shipping_data.state,
                    orderDetail.shipping_data.zip_code, orderDetail.shipping_data.country, orderDetail.pictureUrls, orderDetail.unit_price,
                    orderDetail.color_name, orderDetail.sale_fee, orderDetail.shipping_data.list_cost, orderDetail.invoice_id,
                    orderDetail.invoice_key, userid
                ];

                await pool.query(insertQuery, values);
            }
        }

        await pool.query(`
            UPDATE ordersMercado
            SET status_simc = 'issue'
            WHERE status = 'ready_to_ship' 
            AND (
                (substatus = 'ready_to_print' AND tracking_method = 'VAJU6732707 Super Express')
                OR substatus = 'invoice_pending'
            )
            AND status_simc = '' 
            AND userid = $1;
        `, [userid]);

        res.status(200).json({ data });

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: error.message });
    }
};


//Get Pedidos All Pedidos no Banco
const mercadoLivreGetBdOrders = async (req, res) => {
    try {
        const userid = req.query.userId;
        const searchTerm = req.query.searchTerm;
        const searchColumn = req.query.searchColumn || 'title';
        const precoMin = req.query.precoMin;
        const precoMax = req.query.precoMax;

        if (!userid) {
            return res.status(400).json({ message: 'O parâmetro userid é obrigatório.' });
        }

        let query = 'SELECT * FROM ordersMercado WHERE userid = $1';
        const queryParams = [userid];

        // pesquisa
        if (searchTerm && searchTerm.trim() !== '') {
            query += ` AND ${searchColumn} ILIKE $${queryParams.length + 1}`;
            queryParams.push(`%${searchTerm}%`);
        }

        // filtros
        if (precoMin) {
            query += ` AND total_paid_amount >= $${queryParams.length + 1}`;
            queryParams.push(precoMin);
        }  // total_paid_amount -> valor total pago

        if (precoMax) {
            query += ` AND total_paid_amount <= $${queryParams.length + 1}`;
            queryParams.push(precoMax);
        }

        query += ' ORDER BY date_created DESC';

        const ordersMercado = await pool.query(query, queryParams);

        res.status(200).json({ orders: ordersMercado.rows });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar os pedidos do banco de dados.' });
    }
};

//Get Pedidos All Pedidos Aprovado no Banco para Emitir
const mercadoLivreGetApproved = async (req, res) => {
    try {
        const userid = req.query.userId;
        const searchTerm = req.query.searchTerm;
        const searchColumn = req.query.searchColumn || 'title';
        const precoMin = req.query.precoMin;
        const precoMax = req.query.precoMax;

        const status = 'ready_to_ship';
        const substatus = 'invoice_pending';
        // const status_simc = 'issue';

        if (!userid) {
            return res.status(400).json({ message: 'O parâmetro userid é obrigatório.' });
        }

        let query = `SELECT * FROM ordersMercado 
                     WHERE userid = $1 
                     AND status = $2 
                     AND substatus = $3`;
        const queryParams = [userid, status, substatus];

        // pesquisa
        if (searchTerm && searchTerm.trim() !== '') {
            query += ` AND ${searchColumn} ILIKE $${queryParams.length + 1}`;
            queryParams.push(`%${searchTerm}%`);
        }

        // filtros
        if (precoMin) {
            query += ` AND total_paid_amount >= $${queryParams.length + 1}`;
            queryParams.push(precoMin);
        }

        if (precoMax) {
            query += ` AND total_paid_amount <= $${queryParams.length + 1}`;
            queryParams.push(precoMax);
        }

        query += ' ORDER BY date_created DESC';

        const ordersMercado = await pool.query(query, queryParams);

        res.status(200).json({ orders: ordersMercado.rows });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar os pedidos do banco de dados.' });
    }
};

//Get Pedidos All Pedidos Ready no Banco - Pedidos pronto para enviar
const mercadoLivreGetReady = async (req, res) => {
    try {
        const userid = req.query.userId;
        const searchTerm = req.query.searchTerm;
        const searchColumn = req.query.searchColumn || 'title';
        const precoMin = req.query.precoMin;
        const precoMax = req.query.precoMax;

        const status = 'ready_to_ship';
        const substatus = 'ready_to_print';
        const statusSimc = 'organize';

        let query = `SELECT * FROM ordersMercado 
                     WHERE userid = $1 
                     AND ((status = $2 AND substatus = $3) OR status_simc = $4)`;
        const queryParams = [userid, status, substatus, statusSimc];

        // const ordersMercado = await pool.query(
        //     `SELECT * FROM ordersMercado 
        //          WHERE userid = $1 
        //          AND ((status = $2 AND substatus = $3) OR status_simc = $4)
        //          ORDER BY date_created DESC`,
        //     [userid, status, substatus, statusSimc]
        // );

        // pesquisa
        if (searchTerm && searchTerm.trim() !== '') {
            query += ` AND ${searchColumn} ILIKE $${queryParams.length + 1}`;
            queryParams.push(`%${searchTerm}%`);
        }

        // filtros
        if (precoMin) {
            query += ` AND total_paid_amount >= $${queryParams.length + 1}`;
            queryParams.push(precoMin);
        }  // total_paid_amount -> valor total pago

        if (precoMax) {
            query += ` AND total_paid_amount <= $${queryParams.length + 1}`;
            queryParams.push(precoMax);
        }

        query += ' ORDER BY date_created DESC';

        const ordersMercado = await pool.query(query, queryParams);

        res.status(200).json({ orders: ordersMercado.rows });
    } catch (error) {
        console.error('Erro ao recuperar os pedidos:', error);
        res.status(500).json({ message: 'Erro ao recuperar os pedidos do banco de dados.' });
    }
};

//Get Pedidos All Pedidos Ready Printed no Banco - Pedidos pronto para enviar mas já foi Impresso
const mercadoLivreGetReadyPrinted = async (req, res) => {
    try {
        const userid = req.query.userId;
        const searchTerm = req.query.searchTerm;
        const searchColumn = req.query.searchColumn || 'title';
        const precoMin = req.query.precoMin;
        const precoMax = req.query.precoMax;

        const status = 'ready_to_ship'
        const substatus = 'printed'

        let query = `SELECT * FROM ordersMercado 
                    WHERE userid = $1 
                    AND status = $2 
                    AND substatus = $3`;
        const queryParams = [userid, status, substatus];

        // pesquisa
        if (searchTerm && searchTerm.trim() !== '') {
            query += ` AND ${searchColumn} ILIKE $${queryParams.length + 1}`;
            queryParams.push(`%${searchTerm}%`);
        }

        // filtros
        if (precoMin) {
            query += ` AND total_paid_amount >= $${queryParams.length + 1}`;
            queryParams.push(precoMin);
        }  // total_paid_amount -> valor total pago

        if (precoMax) {
            query += ` AND total_paid_amount <= $${queryParams.length + 1}`;
            queryParams.push(precoMax);
        }

        query += ' ORDER BY date_created DESC';

        const ordersMercado = await pool.query(query, queryParams);

        res.status(200).json({ orders: ordersMercado.rows });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar os pedidos do banco de dados.' });
    }
};

//Get Pedidos All Pedidos Delivered no Banco
const mercadoLivreGetDelivered = async (req, res) => {
    try {
        const userid = req.query.userId;
        const searchTerm = req.query.searchTerm;
        const searchColumn = req.query.searchColumn || 'title';
        const precoMin = req.query.precoMin;
        const precoMax = req.query.precoMax;

        let query = `SELECT * FROM ordersMercado 
                    WHERE userid = $1 
                    AND (
                    (status = $2) OR 
                    (status = $3 AND substatus = $4) OR 
                    (status = $3 AND substatus = $5)
                )`;
        const queryParams = [userid, 'delivered', 'ready_to_ship', 'picked_up', 'in_hub'];

        // pesquisa
        if (searchTerm && searchTerm.trim() !== '') {
            query += ` AND ${searchColumn} ILIKE $${queryParams.length + 1}`;
            queryParams.push(`%${searchTerm}%`);
        }

        // filtros
        if (precoMin) {
            query += ` AND total_paid_amount >= $${queryParams.length + 1}`;
            queryParams.push(precoMin);
        }  // total_paid_amount -> valor total pago

        if (precoMax) {
            query += ` AND total_paid_amount <= $${queryParams.length + 1}`;
            queryParams.push(precoMax);
        }

        query += ' ORDER BY date_created DESC';

        const ordersMercado = await pool.query(query, queryParams);

        res.status(200).json({ orders: ordersMercado.rows });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar os pedidos do banco de dados.' });
    }
};


//Post Emissão de Pedidos Selecionados
const mercadoLivrePostNota = async (req, res) => {
    try {
        // Recebendo o código do frontend
        const ordersBatch = req.body.ordersBatch;
        console.log('ordersBatch:', ordersBatch);

        const userid = req.body.userId;
        const userMercado = await validaIdUserMercado(userid); // Puxando id do usuário do Mercado Livre
        const access_token = await validaToken(userid);

        // Iterando sobre cada conjunto de pedidos
        for (const orders of ordersBatch) {
            const response = await fetch(`https://api.mercadolibre.com/users/${userMercado}/invoices/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json' // Definindo o tipo de conteúdo do corpo da requisição
                },
                body: JSON.stringify({ "orders": orders }) // Convertendo o corpo da requisição para JSON, passando o conjunto de pedidos
            });

            if (!response.ok) {
                const errorData = await response.json(); // Tentando extrair informações do corpo da resposta
                let errorMessage = 'Erro na solicitação do token';
                if (errorData && errorData.message) {
                    errorMessage = errorData.message; // Se houver uma mensagem de erro na resposta, use-a
                }
                throw new Error(errorMessage);
            }

            // Você pode fazer algo com a resposta se necessário
            const responseData = await response.json();
            console.log('Resposta da API:', responseData);

            // Atualizando o status_simc para 'organize'
            for (const order_id of orders) {
                await pool.query(
                    `UPDATE ordersMercado 
                     SET status_simc = $1 
                     WHERE order_id = $2 AND userid = $3`,
                    ['organize', order_id, userMercado]
                );
            }
        }

        res.status(200).json({ message: 'Notas postadas com sucesso.' });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao processar a solicitação.' });
    }
};

//impressão Etiqueta
const mercadoLivreGetPrint = async (req, res) => {
    try {
        const userid = req.body.userId;
        console.log('SHIPPING IDS:', req.body)
        const access_token = await validaToken(userid);
        let shipping_ids = req.body.shipping_id;


        console.log("USER ID>", userid)
        console.log('Received shipping_ids:', shipping_ids);

        // Verifica se shipping_ids é um array, se não, transforma em um array
        if (!Array.isArray(shipping_ids)) {
            shipping_ids = [shipping_ids];
        }

        // Converte o array de shipping_ids em uma string separada por vírgulas
        const shipping_ids_string = shipping_ids.join(',');

        console.log('Shipping IDs string:', shipping_ids_string);

        // Faz a requisição para obter o PDF das etiquetas de envio
        const response = await fetch(`https://api.mercadolibre.com/shipment_labels?shipment_ids=${shipping_ids_string}&response_type=pdf`, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        // Verifica se a resposta foi bem-sucedida
        if (!response.ok) {
            // Tenta obter a mensagem de erro detalhada da resposta
            const errorData = await response.json();
            let errorMessage = 'Erro na solicitação do token';
            if (errorData && errorData.error_description) {
                errorMessage = errorData.error_description;
            }
            throw new Error(errorMessage);
        }


        // Obtém o PDF da resposta como um ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();
        const pdfBuffer = Buffer.from(arrayBuffer);

        // Configura os cabeçalhos da resposta para indicar que é um PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="etiqueta.pdf"');

        // Envie o PDF como resposta
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Erro:', error);
        // Envia uma mensagem de erro na resposta
        res.status(500).send({ error: 'Erro ao processar a solicitação de Impressão.' });
    }
};


const mercadoLivreGetOrdersDetailsId = async (req, res) => {
    try {
        const { shippingIds, userId } = req.query;

        console.log('userId:', userId);
        console.log('shippingIds:', shippingIds);

        if (!shippingIds || shippingIds.length === 0) {
            return res.status(400).json({ message: 'Nenhum shipping_id foi fornecido.' });
        }

        const placeholders = shippingIds.map((_, index) => `$${index + 2}`).join(', ');

        const query = `
            SELECT 
                o.shipping_id,
                o.product_sku AS "productSKU",
                o.reason AS "Description",
                o.color_name AS "variation",
                o.quantity,
                o.unit_price * o.quantity AS "total",
                o.zip_code AS "zipCode",
                o.receiver_name AS "receiverName",
                u.nome_mercado AS "senderName"
            FROM ordersmercado o
            JOIN usermercado u ON u.userid::TEXT = o.userid
            WHERE u.userid = $1 
              AND o.shipping_id IN (${placeholders})
            ORDER BY o.shipping_id, o.product_sku;
        `;

        const values = [userId, ...shippingIds];

        const result = await pool.query(query, values);

        res.status(200).json({ orders: result.rows });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar os detalhes dos pedidos do banco de dados.' });
    }
};

const mercadoLivreGetCounts = async (req, res) => {
    try {
        const userid = req.query.userId;

        // Count all unique orders based on shipping_id
        const allOrdersCount = await pool.query(
            `SELECT COUNT(DISTINCT shipping_id) AS count
             FROM ordersMercado 
             WHERE userid = $1`,
            [userid]
        );

        // Count approved unique orders (status = 'ready_to_ship' and substatus = 'invoice_pending')
        const approvedOrdersCount = await pool.query(
            `SELECT COUNT(DISTINCT shipping_id) AS count
             FROM ordersMercado 
             WHERE userid = $1 
             AND status = $2 
             AND substatus = $3`,
            [userid, 'ready_to_ship', 'invoice_pending']
        );

        // Count ready to ship unique orders (status = 'ready_to_ship' and substatus = 'ready_to_print')
        const readyOrdersCount = await pool.query(
            `SELECT COUNT(DISTINCT shipping_id) AS count
             FROM ordersMercado 
             WHERE userid = $1 
             AND status = $2 
             AND substatus = $3`,
            [userid, 'ready_to_ship', 'ready_to_print']
        );

        // Count ready and printed unique orders (status = 'ready_to_ship' and substatus = 'printed')
        const readyPrintedOrdersCount = await pool.query(
            `SELECT COUNT(DISTINCT shipping_id) AS count
             FROM ordersMercado 
             WHERE userid = $1 
             AND status = $2 
             AND substatus = $3`,
            [userid, 'ready_to_ship', 'printed']
        );

        // Count delivered unique orders (status = 'delivered' or status = 'ready_to_ship' and substatus = 'picked_up' or 'in_hub')
        const deliveredOrdersCount = await pool.query(
            `SELECT COUNT(DISTINCT shipping_id) AS count
             FROM ordersMercado 
             WHERE userid = $1 
             AND (
                 status = $2 OR 
                 (status = $3 AND substatus = $4) OR 
                 (status = $3 AND substatus = $5)
             )`,
            [userid, 'delivered', 'ready_to_ship', 'picked_up', 'in_hub']
        );

        // Combine all counts into one response
        res.status(200).json({
            totalOrders: allOrdersCount.rows[0].count,
            approvedOrders: approvedOrdersCount.rows[0].count,
            readyOrders: readyOrdersCount.rows[0].count,
            readyPrintedOrders: readyPrintedOrdersCount.rows[0].count,
            deliveredOrders: deliveredOrdersCount.rows[0].count
        });

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar as contagens de pedidos do banco de dados.' });
    }
};



//Get Pedidos por Id Do Pedido
// const mercadoLivreGetIdOrders = async (req, res) => {
//     try {
//         // const pedidoId = req.query.pedidoId; // Puxando id Mercado User
//         // const access_token = await validaToken();

//         const response = await fetch(`https://api.mercadolibre.com/orders/2000006146777870`, {
//             headers: {
//                 'Authorization': `Bearer APP_USR-8470533338689335-051407-d0c2ad54dbeef08f00dfb0bfecd344c2-739387240`
//             }
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             let errorMessage = 'Erro na solicitação do token';
//             if (errorData && errorData.error_description) {
//                 errorMessage = errorData.error_description;
//             }
//             throw new Error(errorMessage);
//         }

//         const order = await response.json(); // Obter dados do pedido

//         const orderDetail = {
//             reason: order.payments[0].reason, // Motivo do pagamento
//             total_paid_amount: order.payments[0].total_paid_amount, // Pagamento Total
//             buyer_nickname: order.buyer.nickname, // Nome do comprador
//             order_id: order.payments[0].order_id, // Id do Pedido
//             date_last_modified: order.payments[0].date_last_modified,// Data em que foi pago
//             total_amount: order.total_amount, // Lucro
//             date_created: order.date_created, // Data em que o pedido foi criado
//             // seller_nickname: order.seller.nickname, // Nome da Loja
//             status: order.tags, // Status do Pedido
//             shipping_id: order.shipping.id, // ID do Envio
//             shipping_data: null, // Adicionando os dados de Envio aqui
//         };

//         // Obter os detalhes do envio
//         const shippingResponse = await fetch(`https://api.mercadolibre.com/shipments/${orderDetail.shipping_id}`, {
//             headers: {
//                 'Authorization': `Bearer APP_USR-8470533338689335-051407-d0c2ad54dbeef08f00dfb0bfecd344c2-739387240`
//             }
//         });

//         if (!shippingResponse.ok) {
//             const errorData = await shippingResponse.json();
//             let errorMessage = 'Erro na solicitação do token';
//             if (errorData && errorData.error_description) {
//                 errorMessage = errorData.error_description;
//             }
//             throw new Error(errorMessage);
//         }

//         const shippingData = await shippingResponse.json(); // Obter dados do envio

//         // Adicionar os detalhes do envio ao objeto de pedido
//         orderDetail.shipping_data = {
//             tracking_number: shippingData.tracking_number, //Numero rastreio
//             tracking_method: shippingData.tracking_method, 
//             street_name: shippingData.receiver_address.street_name, //Nome rua
//             receiver_name: shippingData.receiver_address.receiver_name, //Nome do Recebedor
//             address_line: shippingData.receiver_address.address_line, //Endereço
//             neighborhood: shippingData.receiver_address.neighborhood.name, //Bairro
//             city: shippingData.receiver_address.city.name, //CIdade
//             state: shippingData.receiver_address.state.name, //Estado
//             zip_code: shippingData.receiver_address.zip_code, //CEP
//             country: shippingData.receiver_address.country.id, //Pais
//         };

//         // Enviar os dados do pedido com detalhes de envio como resposta
//         res.status(200).json({ data: orderDetail });

//     } catch (error) {
//         console.error('Erro:', error);
//         res.status(500).json({ message: 'Erro ao processar a solicitação de Produtos.' });
//     }    
// };



module.exports = {
    mercadoLivreGetAllOrders,
    mercadoLivreGetBdOrders,
    mercadoLivrePostNota,
    mercadoLivreGetApproved,
    mercadoLivreGetReady,
    mercadoLivreGetPrint,
    mercadoLivreGetDelivered,
    mercadoLivreGetReadyPrinted,
    mercadoLivreGetCounts,
    mercadoLivreGetOrdersDetailsId
};

