import pool from '../../bd.js';
import { getUserId } from '../../utils/verifyToken.js';
import Joi from 'joi';


const stockSchema = Joi.object({
  SKU: Joi.string().max(55).required(),
  Nome_do_Produto: Joi.string().max(255).required(),
  Apelido_do_Produto: Joi.string().max(255).allow('').optional(),
  Categorias: Joi.string().max(255).allow('').optional(),
  Codigo_de_Barras: Joi.string().max(50).allow('').optional(),
  Data_de_Lancamento: Joi.date().optional(),
  Status_da_Venda: Joi.string().valid('Ativo', 'Inativo').optional(),
  Vendedor: Joi.string().max(100).allow('').optional(),
  Preco_de_Varejo: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).allow('').optional(),
  Custo_de_Compra: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).allow('').optional(),
  Descricao: Joi.string().allow('').optional(),
  Link_do_Fornecedor: Joi.string().uri().max(255).allow('').optional(),
  Brand: Joi.string().max(100).allow('').optional(),
  Tamanho: Joi.string().max(50).allow('').optional(),
  Peso_do_Pacote: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).allow('').optional(),
  Tamanho_de_Embalagem: Joi.string().max(50).allow('').optional(),
  Link_do_Video: Joi.string().uri().max(255).allow('').optional(),
  NCM: Joi.string().max(20).allow('').optional(),
  CEST: Joi.string().max(20).allow('').optional(),
  Unidade: Joi.string().max(10).allow('').optional(),
  Origem: Joi.string().max(50).allow('').optional(),
  quantidade: Joi.array().items(Joi.number().integer()).optional(),
  SkuMercado: Joi.array().items(Joi.string().max(50)).allow('').optional(),
});

const stockVariantSchema = Joi.object({
  SPU: Joi.number().integer().required(),
  SKU: Joi.string().max(255).required(),
  Nome_do_Produto: Joi.string().max(255).required(),
  Apelido_do_Produto: Joi.string().max(100).allow('').optional(),
  Categorias: Joi.string().max(255).allow('').optional(),
  Codigo_de_Barras: Joi.string().max(50).allow('').optional(),
  Data_de_Lancamento: Joi.date().optional(),
  Status_da_Venda: Joi.string().valid('Ativo', 'Inativo').optional(),
  Vendedor: Joi.string().max(100).allow('').optional(),
  Preco_de_Varejo: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).allow('').optional(),
  Custo_de_Compra: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).allow('').optional(),
  Descricao: Joi.string().allow('').optional(),
  Link_do_Fornecedor: Joi.string().uri().max(255).allow('').optional(),
  Brand: Joi.string().max(100).allow('').optional(),
  Tamanho: Joi.string().max(50).allow('').optional(),
  Cor: Joi.string().max(50).allow('').optional(),
  Adicionar: Joi.string().max(255).allow('').optional(),
  Peso_do_Pacote: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).allow('').optional(),
  Tamanho_de_Embalagem: Joi.string().max(50).allow('').optional(),
  Link_do_Video: Joi.string().uri().max(255).allow('').optional(),
  NCM: Joi.string().max(20).allow('').optional(),
  CEST: Joi.string().max(20).allow('').optional(),
  Unidade: Joi.string().max(10).allow('').optional(),
  Origem: Joi.string().max(50).allow('').optional(),
  quantidade: Joi.number().integer().optional(),
  transito: Joi.number().integer().optional(),
  disponivel: Joi.number().integer().optional(),
  quantidade_total: Joi.number().integer().optional(),
});

// Rota para criar um novo item no estoque
export async function productStock(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).send('Usuário não autenticado.');

  try {
    const { error, value } = stockSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const body = value;

    // Verificar e ajustar o status da venda
    let statusVenda = body.Status_da_Venda
      ? (body.Status_da_Venda === 'Ativo' ? 'Ativo' : 'Inativo')
      : null;

    // SkuMercado → string
    let skuMercado = Array.isArray(body.SkuMercado)
      ? body.SkuMercado.join(', ')
      : body.SkuMercado;

    // quantidade → number
    let quantidade = Array.isArray(body.quantidade)
      ? body.quantidade.reduce((a, c) => a + c, 0)
      : body.quantidade;

    await prisma.stock.create({
      data: {
        sku: body.SKU,
        nome_do_produto: body.Nome_do_Produto,
        apelido_do_produto: body.Apelido_do_Produto,
        categorias: body.Categorias,
        codigo_de_barras: body.Codigo_de_Barras,
        data_de_lancamento: body.Data_de_Lancamento,
        status_da_venda: statusVenda,
        vendedor: body.Vendedor,
        preco_de_varejo: body.Preco_de_Varejo
          ? parseFloat(body.Preco_de_Varejo)
          : null,
        custo_de_compra: body.Custo_de_Compra
          ? parseFloat(body.Custo_de_Compra)
          : null,
        descricao: body.Descricao,
        link_do_fornecedor: body.Link_do_Fornecedor,
        marca: body.Brand,
        peso_do_pacote: body.Peso_do_Pacote
          ? parseFloat(body.Peso_do_Pacote)
          : null,
        tamanho_de_embalagem: body.Tamanho_de_Embalagem,
        link_do_video: body.Link_do_Video,
        ncm: body.NCM,
        cest: body.CEST,
        unidade: body.Unidade,
        origem: body.Origem,
        quantidade: quantidade,
        skumercado: skuMercado,
        userId: userId,
      },
    });

    return res.status(201).send('Item adicionado ao estoque.');
  } catch (err) {
    console.error('Erro ao adicionar item:', err);
    if (err.code === 'P2002')
      return res.status(400).send('SKU ou Código de Barras já existem.');
    return res.status(500).send('Erro interno do servidor.');
  }
}

// EDITAR PRODUTO ESTOQUE
export async function editProductStock(req, res) {
  const userId = req.user?.id;
  const SKU = req.body.productSKU;
  if (!userId) return res.status(401).send('Usuário não autenticado.');

  try {
    const { error, value } = stockSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const body = value;

    // Mesma lógica de parseFloat/arrays do create...
    let statusVenda = body.Status_da_Venda
      ? (body.Status_da_Venda === 'Ativo' ? 'Ativo' : 'Inativo')
      : null;
    let skuMercado = Array.isArray(body.SkuMercado)
      ? body.SkuMercado.join(', ')
      : body.SkuMercado;
    let quantidade = Array.isArray(body.quantidade)
      ? body.quantidade.reduce((a, c) => a + c, 0)
      : body.quantidade;

    const update = await prisma.stock.updateMany({
      where: { sku: SKU, userId },
      data: {
        nome_do_produto: body.Nome_do_Produto,
        apelido_do_produto: body.Apelido_do_Produto,
        categorias: body.Categorias,
        codigo_de_barras: body.Codigo_de_Barras,
        data_de_lancamento: body.Data_de_Lancamento,
        status_da_venda: statusVenda,
        vendedor: body.Vendedor,
        preco_de_varejo: body.Preco_de_Varejo
          ? parseFloat(body.Preco_de_Varejo)
          : null,
        custo_de_compra: body.Custo_de_Compra
          ? parseFloat(body.Custo_de_Compra)
          : null,
        descricao: body.Descricao,
        link_do_fornecedor: body.Link_do_Fornecedor,
        marca: body.Brand,
        peso_do_pacote: body.Peso_do_Pacote
          ? parseFloat(body.Peso_do_Pacote)
          : null,
        tamanho_de_embalagem: body.Tamanho_de_Embalagem,
        link_do_video: body.Link_do_Video,
        ncm: body.NCM,
        cest: body.CEST,
        unidade: body.Unidade,
        origem: body.Origem,
        quantidade,
        skumercado: skuMercado,
      },
    });

    if (update.count === 0)
      return res.status(404).json({ error: 'Produto não encontrado.' });

    return res.status(200).json({ message: 'Produto atualizado com sucesso.' });
  } catch (err) {
    console.error('Erro ao editar o produto:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

// Rota para criar variantes de produto no estoque
export async function productVariStockVariant(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).send('Usuário não autenticado.');

  const { error, products } = req.body;
  if (error) return res.status(400).send(error.details[0].message);

  const { variacoes, ...base } = products;
  try {
    const creations = (variacoes || []).map((v) => ({
      data: {
        spu: base.SPU, // supondo que vem em base.SPU
        sku: base.SKU,
        nome_do_produto: base.Nome_do_Produto,
        apelido_do_produto: base.Apelido_do_Produto,
        categorias: base.Categorias,
        codigo_de_barras: base.Codigo_de_Barras,
        data_de_lancamento: base.Data_de_Lancamento,
        status_da_venda: base.Status_da_Venda,
        vendedor: base.Vendedor,
        preco_de_varejo: base.Preco_de_Varejo
          ? parseFloat(base.Preco_de_Varejo)
          : null,
        custo_de_compra: base.Custo_de_Compra
          ? parseFloat(base.Custo_de_Compra)
          : null,
        descricao: base.Descricao,
        link_do_fornecedor: base.Link_do_Fornecedor,
        marca: base.Brand,
        peso_do_pacote: base.Peso_do_Pacote
          ? parseFloat(base.Peso_do_Pacote)
          : null,
        tamanho_de_embalagem: base.Tamanho_de_Embalagem,
        link_do_video: base.Link_do_Video,
        ncm: base.NCM,
        cest: base.CEST,
        unidade: base.Unidade,
        origem: base.Origem,
        quantidade: base.quantidade,
        transito: v.transito,
        disponivel: v.disponivel,
        quantidade_total: v.quantidade_total,
        tamanho: v.tamanho,
        cor: v.cor,
        adicionar: v.adicionar,
        userId,
      },
    }));

    // se não houver variações, cria apenas o base
    if (creations.length === 0) {
      creations.push({
        data: {
          ...creations[0].data,
          // sem cor, tamanho etc
        },
      });
    }

    await prisma.stockVariant.createMany({ data: creations.map(c => c.data) });
    return res.status(201).send('Variantes adicionadas ao estoque.');
  } catch (err) {
    console.error('Erro ao adicionar variantes:', err);
    if (err.code === 'P2002')
      return res.status(400).send('SKU ou Código de Barras já existem.');
    return res.status(500).send('Erro interno do servidor.');
  }
}

// Rota para criar um novo item no estoque KIT
export async function productKitStock(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).send('Usuário não autenticado.');

  const {
    SKUKIT,
    SKU,
    Nome_do_Produto,
    Apelido_do_Produto,
    Categorias,
    Custo_de_Compra,
    Status_da_Venda,
    SkuMercado,
    quantidade = 0,
  } = req.body;

  if (!SKUKIT || !SKU || !Nome_do_Produto)
    return res.status(400).send('Campos obrigatórios faltando.');

  // trata arrays
  const skuTexto = Array.isArray(SKU) ? SKU.join(', ') : SKU;
  const custoTexto = Array.isArray(Custo_de_Compra)
    ? Custo_de_Compra.map(v => parseFloat(v)).join(', ')
    : Custo_de_Compra;
  const skumerTexto = Array.isArray(SkuMercado)
    ? SkuMercado.join(', ')
    : SkuMercado;

  try {
    await prisma.stockKit.create({
      data: {
        skukit: SKUKIT,
        sku: skuTexto,
        nome_do_produto: Nome_do_Produto,
        apelido_do_produto: Apelido_do_Produto,
        categorias: Categorias,
        custo_de_compra: parseFloat(custoTexto),
        quantidade,
        status_da_venda: Status_da_Venda,
        skumercado: skumerTexto,
        userId,
      },
    });
    return res.status(201).send('Kit adicionado ao estoque.');
  } catch (err) {
    console.error('Erro ao adicionar kit:', err);
    if (err.code === 'P2002')
      return res.status(400).send('Chave única violada.');
    return res.status(500).send('Erro interno do servidor.');
  }
}

// Rota para obter todos os itens do estoque
export async function getProductStock(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Usuário não autenticado.' });

  try {
    const estoque = await prisma.stock.findMany({ where: { userId } });
    return res.json(estoque);
  } catch (err) {
    console.error('Erro ao obter itens do estoque:', err);
    return res.status(500).send('Erro interno do servidor.');
  }
}





// // Rota para atualizar um item no estoque
// app.put('/estoque/:SKU', async (req, res) => {
//   const { SKU } = req.params;
//   const { Nome_do_Produto, Apelido_do_Produto, Categorias, Codigo_de_Barras, Data_de_Lancamento, Status_da_Venda, Vendedor, Preco_de_Varejo, Custo_de_Compra, Descricao, Link_do_Fornecedor, Brand, Peso_do_Pacote, Tamanho_de_Embalagem, Link_do_Video, NCM, CEST, Unidade, Origem } = req.body;

//   try {
//     const result = await pool.query('UPDATE Estoque SET Nome_do_Produto = $1, Apelido_do_Produto = $2, Categorias = $3, Codigo_de_Barras = $4, Data_de_Lancamento = $5, Status_da_Venda = $6, Vendedor = $7, Preco_de_Varejo = $8, Custo_de_Compra = $9, Descricao = $10, Link_do_Fornecedor = $11, Brand = $12, Peso_do_Pacote = $13, Tamanho_de_Embalagem = $14, Link_do_Video = $15, NCM = $16, CEST = $17, Unidade = $18, Origem = $19 WHERE SKU = $20',
//       [Nome_do_Produto, Apelido_do_Produto, Categorias, Codigo_de_Barras, Data_de_Lancamento, Status_da_Venda, Vendedor, Preco_de_Varejo, Custo_de_Compra, Descricao, Link_do_Fornecedor, Brand, Peso_do_Pacote, Tamanho_de_Embalagem, Link_do_Video, NCM, CEST, Unidade, Origem, SKU]);

//     res.send('Item do estoque atualizado.');
//   } catch (error) {
//     console.error('Erro ao atualizar item do estoque:', error);
//     res.status(500).send('Erro interno do servidor.');
//   }
// });

// // Rota para deletar um item do estoque
// app.delete('/estoque/:SKU', async (req, res) => {
//   const { SKU } = req.params;

//   try {
//     const result = await pool.query('DELETE FROM Estoque WHERE SKU = $1', [SKU]);
//     res.send('Item do estoque excluído.');
//   } catch (error) {
//     console.error('Erro ao excluir item do estoque:', error);
//     res.status(500).send('Erro interno do servidor.');
//   }
// });
