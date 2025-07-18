import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()


/**
 * Gera um SKU aleatório e garante unicidade via Prisma
 */
const generateUniqueSKU = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let sku = ''
  for (let i = 0; i < 10; i++) {
    sku += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const exists = await prisma.stock.findUnique({
    where: { sku }
  })
  if (exists) {
    // Se já existe, tenta novamente
    return generateUniqueSKU()
  }
  return sku
}


/**
 * Faz fetch de cada produto no ML e retorna arrays de variáveis
 * (sem salvar nada no banco)
 */
export async function syncMercadoLivreStock(req, res) {
  try {
    const userid = req.user?.id
    const idProduct = req.query.idProduct
    if (!userid) return res.status(401).json({ message: 'Usuário não autenticado.' })

    const skuVars = []
    const titleVars = []
    const colorVars = []
    const gtinVars = []
    const statusVars = []
    const priceVars = []
    const availQtyVars = []

    for (let i = 0; i < idProduct.length; i++) {
      const mlId = idProduct[i]
      const resp = await fetch(
        `https://api.mercadolibre.com/items/${mlId}`,
        { headers: { 'Authorization': `Bearer ${access_token}` } }
      )
      if (!resp.ok) {
        const err = await resp.json().catch(() => null)
        throw new Error(err?.error_description || 'Erro na solicitação do ML')
      }
      const data = await resp.json()

      skuVars.push({ [`sku${i + 1}`]: data.id })
      titleVars.push({ [`title${i + 1}`]: data.title })
      statusVars.push({ [`status${i + 1}`]: data.status })
      priceVars.push({ [`price${i + 1}`]: data.price })
      availQtyVars.push({ [`availableQuantity${i + 1}`]: data.available_quantity })

      const color = data.variations?.[0]
        ?.attribute_combinations?.find(a => a.id === 'COLOR')
        ?.value_name ?? 'N/A'
      colorVars.push({ [`color${i + 1}`]: color })

      const gtin = data.attributes?.find(a => a.id === 'GTIN')?.value_name
      gtinVars.push({ [`gtin${i + 1}`]: gtin ?? 'N/A' })
    }

    res.json({
      sku: skuVars,
      titleVariables: titleVars,
      colorVariables: colorVars,
      gtinVariables: gtinVars,
      statusVariables: statusVars,
      priceVariables: priceVars,
      availableQuantityVariables: availQtyVars
    })
  } catch (error) {
    console.error('Erro:', error)
    res.status(500).json({ message: 'Erro ao processar a solicitação de Produtos.' })
  }
}


/**
 * Insere no nosso estoque local (tabela stock) usando Prisma
 */
export async function productStockMercado(req, res) {
  try {
    const userid = req.user?.id
    const productsData = req.body.productsData

    if (
      !userid ||
      !Array.isArray(productsData) ||
      productsData.length === 0
    ) {
      return res.status(400).send('Por favor, forneça dados válidos.')
    }

    for (let i = 0; i < productsData.length; i++) {
      const p = productsData[i]
      if (!p.Nome_do_Produto || p.Preco_de_Varejo == null) {
        return res
          .status(400)
          .send(`Campos obrigatórios faltando no produto ${i + 1}`)
      }

      // traduzir status
      const statusVenda =
        p.Status_da_Venda === 'paused'
          ? 'Inativo'
          : 'Ativo'

      const sku = await generateUniqueSKU()

      await prisma.stock.create({
        data: {
          sku,
          nome_do_produto: p.Nome_do_Produto,
          status_da_venda: statusVenda,
          preco_de_varejo: Number(p.Preco_de_Varejo),
          quantidade: Number(p.quantidade ?? 0),
          skumercado: String(p.SkuMercado ?? ''),
          userId: userid
        }
      })
    }

    res.status(201).send('Itens adicionados ao estoque.')
  } catch (error) {
    console.error('Erro ao adicionar item:', error)
    // P2002 = violação de unique constraint no Prisma
    if (error.code === 'P2002') {
      return res.status(400).send('SKU já existe.')
    }
    res.status(500).send('Erro interno do servidor.')
  }
}
