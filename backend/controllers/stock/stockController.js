const pool = require('../../bd.js');
const { GetUserId } = require('../../utils/verifyToken.js');
const Joi = require('joi');

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
const productStock = async (req, res) => {
  const userid = GetUserId();

  try {
    const { error, value } = stockSchema.validate(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }

    const body = value;

    // Verificar e ajustar o status da venda
    let statusVenda = body.Status_da_Venda;
    if (statusVenda) {
      statusVenda = statusVenda === 'Ativo' ? 'Ativo' : 'Inativo';
    }

    // Verificar se SkuMercado é uma matriz e concatená-la com vírgulas
    let skuMercado = body.skuMercado;
    if (Array.isArray(skuMercado)) {
      skuMercado = skuMercado.join(', ');
    }

    // Somar todos os valores de quantidade se for um array
    let quantidade = body.quantidade;
    if (Array.isArray(quantidade)) {
      quantidade = quantidade.reduce((acc, curr) => acc + curr, 0);
    }

    // Insere o produto no banco de dados
    const result = await pool.query(
      `INSERT INTO stock (SKU, Nome_do_Produto, Apelido_do_Produto, Categorias, Codigo_de_Barras, Data_de_Lancamento, Status_da_Venda,
        Vendedor, Preco_de_Varejo, Custo_de_Compra, Descricao, Link_do_Fornecedor, Brand, Peso_do_Pacote, Tamanho_de_Embalagem,
        Link_do_Video, NCM, CEST, Unidade, Origem, quantidade, skuMercado, userid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
      [body.SKU, body.Nome_do_Produto, body.Apelido_do_Produto, body.Categorias, body.Codigo_de_Barras, body.Data_de_Lancamento, statusVenda,
      body.Vendedor, body.Preco_de_Varejo, body.Custo_de_Compra, body.Descricao, body.Link_do_Fornecedor, body.Brand, body.Peso_do_Pacote, body.Tamanho_de_Embalagem,
      body.Link_do_Video, body.NCM, body.CEST, body.Unidade, body.Origem, quantidade, skuMercado, userid]
    );

    res.status(201).send('Item adicionado ao estoque.');
  } catch (error) {
    console.error('Erro ao adicionar item:', error);
    if (error.code === '23505') { // Erro de violação de restrição de chave única
      return res.status(400).send('SKU ou Código de Barras já existem.');
    }
    res.status(500).send('Erro interno do servidor.');
  }
};



// EDITAR PRODUTO ESTOQUE
const editProductStock = async (req, res) => {
  const userid = GetUserId();
  const SKU = req.body.productSKU;

  try {
    // Validação Joi
    const { error, value } = stockSchema.validate(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }

    const body = value;

    const result = await pool.query(
      `UPDATE stock SET 
        Nome_do_Produto = $1, 
        Apelido_do_Produto = $2, 
        Categorias = $3, 
        Codigo_de_Barras = $4,
        Data_de_Lancamento = $5, 
        Status_da_Venda = $6, 
        Vendedor = $7, 
        Preco_de_Varejo = $8, 
        Custo_de_Compra = $9,
        Descricao = $10, 
        Link_do_Fornecedor = $11, 
        Brand = $12, 
        Peso_do_Pacote = $13, 
        Tamanho_de_Embalagem = $14,
        Link_do_Video = $15, 
        NCM = $16, 
        CEST = $17, 
        Unidade = $18, 
        Origem = $19, 
        quantidade = $20 
      WHERE SKU = $21 AND userid = $22`,
      [body.Nome_do_Produto, body.Apelido_do_Produto, body.Categorias, body.Codigo_de_Barras, body.Data_de_Lancamento,
      body.Status_da_Venda, body.Vendedor, body.Preco_de_Varejo, body.Custo_de_Compra, body.Descricao, body.Link_do_Fornecedor,
      body.Brand, body.Peso_do_Pacote, body.Tamanho_de_Embalagem, body.Link_do_Video, body.NCM, body.CEST, body.Unidade,
      body.Origem, body.quantidade, SKU, userid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    res.status(200).json({ message: 'Produto atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao editar o produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Rota para criar Viarentes de produto no estoque
const productVariStockVariant = async (req, res) => {
  
  const { error } = stockVariantSchema.validate(req.body);

  if (error) {
    return res.status(400).send(`Erro de validação: ${error.details[0].message}`);
  }

  const userid = GetUserId();
  const { products } = req.body; // Objeto de produtos para criar

  try {
    const insertPromises = [];

    if (products.variacoes && products.variacoes.length > 0) {
      // Itera sobre as variações de cada produto
      for (let i = 0; i < products.variacoes.length; i++) {
        const variacao = products.variacoes[i];
        // Cria um novo objeto de produto com os dados originais
        const novoProduto = {
          ...products, // Mantém os dados do produto original
          Cor: variacao.cor,
          Tamanho: variacao.tamanho,
          Adicionar: variacao.adicionar
        };

        // Insere o novo produto no banco de dados
        const result = await insertNewProduct(novoProduto, userid);
        insertPromises.push(result);
      }
    } else {
      // Se o produto não tiver variações, insira-o como está no banco de dados
      const result = await insertNewProduct(products, userid);
      insertPromises.push(result);
    }

    // Aguarda todas as inserções serem concluídas
    await Promise.all(insertPromises);

    res.status(201).send('Produtos adicionados ao estoque.');
  } catch (error) {
    console.error('Erro ao adicionar produtos:', error);
    if (error.code === '23505') {
      return res.status(400).send('SKU ou Código de Barras já existem.');
    }
    res.status(500).send('Erro interno do servidor.');
  }
};

const insertNewProduct = async (product, userid) => {
  try {
    const result = await pool.query(
      `INSERT INTO stockVariant (SKU, Nome_do_Produto, Apelido_do_Produto, Categorias, Codigo_de_Barras, Data_de_Lancamento, Status_da_Venda,
              Vendedor, Preco_de_Varejo, Custo_de_Compra, Descricao, Link_do_Fornecedor, Brand, Peso_do_Pacote, Tamanho_de_Embalagem,
              Link_do_Video, NCM, CEST, Unidade, Origem, Tamanho, Cor, Adicionar, userid)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
      [product.SKU, product.Nome_do_Produto, product.Apelido_do_Produto, product.Categorias, product.Codigo_de_Barras, product.Data_de_Lancamento, product.Status_da_Venda,
      product.Vendedor, product.Preco_de_Varejo, product.Custo_de_Compra, product.Descricao, product.Link_do_Fornecedor, product.Brand, product.Peso_do_Pacote, product.Tamanho_de_Embalagem,
      product.Link_do_Video, product.NCM, product.CEST, product.Unidade, product.Origem, product.Tamanho, product.Cor, product.Adicionar, userid]
    );

    return result;
  } catch (error) {
    throw error;
  }
};

// Rota para criar um novo item no estoque
const productKitStock = async (req, res) => {
  try {
    const userid = GetUserId();

    const body = {
      SKUKIT: req.body.SKUKIT,
      SKU: req.body.SKU,
      Nome_do_Produto: req.body.Nome_do_Produto,
      Apelido_do_Produto: req.body.Apelido_do_Produto,
      Categorias: req.body.Categorias,
      Custo_de_Compra: req.body.Custo_de_Compra || 40, // Corrigido o nome do campo
      Status_da_Venda: req.body.Status_da_Venda,
      SkuMercado: req.body.SkuMercado,
      quantidade: req.body.quantidade || 100,
    };

    console.log(body)
    // Verifica se todos os campos obrigatórios estão presentes
    if (!body.SKU || !body.Nome_do_Produto || !body.Custo_de_Compra || !userid) {
      return res.status(400).send('Por favor, forneça todos os campos obrigatórios.');
    }
  
    // Verificar se SKU é uma matriz e concatená-la com vírgulas
    let SKU = body.SKU;
    if (Array.isArray(SKU)) {
      SKU = SKU.join(', ');
    }

    // Verificar se Custo_de_Compra é uma matriz e concatená-la com vírgulas
    let Custo_de_Compra = body.Custo_de_Compra;
    if (Array.isArray(Custo_de_Compra)) {
      Custo_de_Compra = Custo_de_Compra.map(value => parseFloat(value)); // Convertendo os valores para números
      Custo_de_Compra = Custo_de_Compra.join(', ');
    }

    // Verificar se SkuMercado é uma matriz e concatená-la com vírgulas
    let skuMercado = body.SkuMercado;
    if (Array.isArray(skuMercado)) {
      skuMercado = skuMercado.join(', ');
    }

    // Insere o produto no banco de dados
    const result = await pool.query(
      `INSERT INTO stockKit (SKUKIT, SKU, Nome_do_Produto, Apelido_do_Produto, Categorias, Custo_de_Compra, Quantidade, Status_da_Venda, SkuMercado, userid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [body.SKUKIT, SKU, body.Nome_do_Produto, body.Apelido_do_Produto, body.Categorias, Custo_de_Compra, body.quantidade, body.Status_da_Venda, skuMercado, userid]
    );

    res.status(201).send('Item adicionado ao estoque.');
  } catch (error) {
    console.error('Erro ao adicionar item:', error);
    if (error.code === '23505') { // Erro de violação de restrição de chave única
      return res.status(400).send('SKU ou Código de Barras já existem.');
    }
    res.status(500).send('Erro interno do servidor.');
  }
};




// // Rota para obter todos os itens do estoque
const getProductStock = async (req, res) => {
  const userid = GetUserId();

  try {
    const result = await pool.query(`SELECT * FROM stock WHERE userid = $1`, [userid]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter itens do estoque:', error);
    res.status(500).send('Erro interno do servidor.');
  }
};



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


module.exports = {
  productStock,
  productVariStockVariant,
  productKitStock,
  getProductStock,
  editProductStock
};
