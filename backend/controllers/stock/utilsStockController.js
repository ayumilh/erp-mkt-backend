import prisma from '../../prisma/client.js';

export async function getProductByIdSKU(req, res) {
    const userId = req.user?.id;
    const sku = req.params.sku; // Supondo que o SKU seja passado como parâmetro na URL

    if (!userId) return res.status(401).send('Usuário não autenticado.');

    try {
        const stockItem = await prisma.stock.findFirst({
            where: {
                userId,
                sku: sku
            }
        });

        if (!stockItem) {
            return res.status(404).send('Produto não encontrado.')
        }

        return res.json(stockItem)
    } catch (error) {
        console.error('Erro ao obter o produto:', error);
        res.status(500).send('Erro interno do servidor.');
    }
};

// search Products Adicionar SKU Estoque
export async function searchProducts(req, res) {
    const userId = req.user?.id
    const { searchQuery } = req.query

    if (!userId) {
        return res.status(401).send('Usuário não autenticado.')
    }

    try {
        // Monta a cláusula `where` dinamicamente
        const where = { userId }
        if (searchQuery) {
            where.OR = [
                { sku: searchQuery },
                { nome_do_produto: { contains: searchQuery, mode: 'insensitive' } }
            ]
        }

        // Busca via Prisma
        const products = await prisma.stock.findMany({
            where,
            select: {
                sku: true,
                nome_do_produto: true
            }
        })

        return res.json(products)
    } catch (error) {
        console.error('Erro ao buscar itens do estoque:', error)
        return res.status(500).send('Erro interno do servidor.')
    }
}

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
export async function getProductSolo(req, res) {
    const userId = req.user?.id
    if (!userId) {
        return res.status(401).send('Usuário não autenticado.')
    }

    // Pode vir como array ou CSV na query string
    let { idProduct } = req.query
    if (!idProduct) {
        return res.status(400).json({ message: 'SKUs não fornecidos.' })
    }
    const skus = Array.isArray(idProduct)
        ? idProduct
        : String(idProduct).split(',').map(s => s.trim()).filter(Boolean)

    if (skus.length === 0) {
        return res.status(400).json({ message: 'SKUs não encontrados.' })
    }

    try {
        const results = await Promise.all(
            skus.map(async sku => {
                const record = await prisma.stock.findFirst({
                    where: { sku, userId },
                    select: {
                        sku: true,
                        custo_de_compra: true,
                        quantidade: true
                    }
                })
                if (!record) {
                    // se quiser retornar erro para cada SKU faltante, pode lançar aqui
                    return { sku, error: 'Produto não encontrado.' }
                }
                return record
            })
        )

        return res.json(results)
    } catch (error) {
        console.error('Erro ao obter itens do estoque:', error)
        return res.status(500).send('Erro interno do servidor.')
    }
}


// Sincronização do Estoque com Plataforma
const syncStock = async (req, res) => {
    try {
        // Usar o SKU temporariamente armazenado
        const userId = req.user?.id;
        const quantidade = req.body.quantidade;
        const transito = req.body.transito;
        const disponivel = req.body.disponivel;
        const quantidade_total = req.body.quantidade_total;

        if (!userId) return res.status(401).send('Usuário não autenticado.');


    } catch (error) {
        console.error('Erro ao obter itens do estoque:', error);
        res.status(500).send('Erro interno do servidor.');
    }
};
