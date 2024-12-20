const pool = require('../../../bd.js');

const validaToken = async (userid) => {

    const result = await pool.query(`SELECT access_token FROM usermercadolivre WHERE userid = ${userid}`);

    if (result.rows.length > 0) {
        const accessToken = result.rows[0].access_token;
        return accessToken;
    } else {
        throw new Error('Usuário não encontrado ou token não definido');
    }
}

const syncMercadoLivreStock = async (req, res) => {
    try {

        const userid = req.query.userId;
        const idProduct = req.query.idProduct;
        console.log(idProduct)
        const access_token = await validaToken(userid);

        const titleVariables = [];
        const skuVariables = [];
        const colorVariables = [];
        const gtinVariables = [];
        const statusVariables = [];
        const priceVariables = [];
        const availableQuantityVariables = []; // Array para armazenar o available_quantity

        for (let i = 0; i < idProduct.length; i++) {
            const result = idProduct[i];

            const response = await fetch(`https://api.mercadolibre.com/items/${result}`, {
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

            const tokenData = await response.json();

            const sku = tokenData.id;
            const variableName3 = `sku${i + 1}`;
            skuVariables.push({ [variableName3]: sku });

            const title = tokenData.title;
            const variableName = `title${i + 1}`;
            titleVariables.push({ [variableName]: title });

            if (tokenData.variations && tokenData.variations.length > 0) {
                const color = tokenData.variations[0].attribute_combinations.find(attr => attr.id === "COLOR")?.value_name;
                const variableName5 = `color${i + 1}`;
                colorVariables.push({ [variableName5]: color });
            } else {
                colorVariables.push({ [`color${i + 1}`]: "N/A" });
            }

            const gtin = tokenData.attributes.find(attr => attr.id === "GTIN")?.value_name;
            gtinVariables.push({ [`gtin${i + 1}`]: gtin || "N/A" });

            const status = tokenData.status;
            statusVariables.push({ [`status${i + 1}`]: status });

            const price = tokenData.price;
            const variableName1 = `price${i + 1}`;
            priceVariables.push({ [variableName1]: price });

            // Obtenha a quantidade atual do produto
            const availableQuantity = tokenData.available_quantity; 
            const variableName2 = `availableQuantity${i + 1}`;
            availableQuantityVariables.push({ [variableName2]: availableQuantity }); 
        }

        res.status(200).json({
            sku: skuVariables,
            titleVariables: titleVariables,
            colorVariables: colorVariables,
            gtinVariables: gtinVariables,
            statusVariables: statusVariables,
            priceVariables: priceVariables,
            availableQuantityVariables: availableQuantityVariables 
        });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao processar a solicitação de Produtos.' });
    }
};

//Criando Sku unico sempre que Houver uma sincronização no productStockMercado
const generateUniqueSKU = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let sku = '';
    for (let i = 0; i < 10; i++) { // Aqui, 10 é o comprimento do SKU, você pode ajustar conforme necessário
        sku += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    // Verifica se o SKU gerado já existe no banco de dados
    const existingSKU = await pool.query('SELECT SKU FROM stock WHERE SKU = $1', [sku]);
    if (existingSKU.rows.length > 0) {
        // Se o SKU já existir, gere um novo SKU
        return generateUniqueSKU();
    }
    return sku; // Retorna o SKU único
};


const productStockMercado = async (req, res) => {
    const userid = req.query.userId;
    const productsData = req.body.productsData;
    console.log(productsData)

    try {
        if (!productsData || !Array.isArray(productsData) || productsData.length === 0 || !userid) {
            return res.status(400).send('Por favor, forneça dados válidos.');
        }

        for (let i = 0; i < productsData.length; i++) {
            const product = productsData[i];

            if (!product.Nome_do_Produto || !product.Preco_de_Varejo) {
                return res.status(400).send(`Por favor, forneça todos os campos obrigatórios para o produto ${i + 1}.`);
            }

            let statusVenda = product.Status_da_Venda;
            if (statusVenda === 'paused') {
                statusVenda = 'Inativo';
            } else {
                statusVenda = 'Ativo';
            }

            const sku = await generateUniqueSKU(); // Função para gerar SKU único

            await pool.query(
                `INSERT INTO stock (SKU, Nome_do_Produto, Status_da_Venda, Preco_de_Varejo, quantidade, skuMercado, userid)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [sku, product.Nome_do_Produto, statusVenda, product.Preco_de_Varejo, product.quantidade, product.SkuMercado, userid]
            );
        }

        res.status(201).send('Itens adicionados ao estoque.');
    } catch (error) {
        console.error('Erro ao adicionar item:', error);
        if (error.code === '23505') {
            return res.status(400).send('SKU ou Código de Barras já existem.');
        }
        res.status(500).send('Erro interno do servidor.');
    }
};



module.exports = {
    syncMercadoLivreStock,
    productStockMercado
};

