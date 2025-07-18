import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import cloudinary from '../../../utils/configs/configCloudinary.js'

const prisma = new PrismaClient()

// --- multer setup
const storage = multer.memoryStorage()
export const upload = multer({ storage })

// --- Helpers

async function validaToken(userId) {
  const rec = await prisma.userMercado.findFirst({
    where: { userId: userId },
    select: { access_token: true },
  })
  if (!rec?.access_token) {
    throw new Error('Usuário não encontrado ou token não definido')
  }
  return rec.access_token
}

async function validaIdUserMercado(userId) {
  const recs = await prisma.userMercado.findMany({
    where: { userId: userId},
    select: { user_mercado_id: true },
  })
  if (!recs.length) throw new Error('Usuário não encontrado ou token não definido')
  return recs.map(r => r.user_mercado_id)
}

// --- Mercado Livre: Sincronização de produtos

export async function mercadoLivreGetProductsSync(req, res) {
  try {
    const userId = req.user.id
    if (!userId) return res.status(400).json({ message: 'userId é obrigatório' })

    const access_token = await validaToken(userId)
    const userMercados = await validaIdUserMercado(userId)

    // 1) Buscar todos os IDs de itens do vendedor
    //    (mantive sua lógica de chamar MercadoLibre em dois endpoints)
    const url1 = `https://api.mercadolibre.com/users/${userMercados}/items/search?orders=stop_time_asc`
    const url2 = `https://api.mercadolibre.com/users/${userMercados}/items/search?orders=start_time_desc`
    const [r1, r2] = await Promise.all([
      fetch(url1, { headers: { Authorization: `Bearer ${access_token}` } }),
      fetch(url2, { headers: { Authorization: `Bearer ${access_token}` } }),
    ])
    if (!r1.ok || !r2.ok) {
      const err = (await (r1.ok ? r2 : r1).json()).error_description || 'Erro na solicitação'
      throw new Error(err)
    }
    const data1 = await r1.json()
    const data2 = await r2.json()
    const ids = Array.from(new Set([
      ...(data1.results || []),
      ...(data2.results || []),
    ]))

    // 2) Trazer dados completos de cada produto e upsert no Prisma
    const products = await Promise.all(ids.map(id =>
      fetch(`https://api.mercadolibre.com/items/${id}`, {
        headers: { Authorization: `Bearer ${access_token}` }
      }).then(r => {
        if (!r.ok) throw new Error('Falha ao buscar item ' + id)
        return r.json()
      })
    ))

    for (const p of products) {
      // extrair todos esses campos exatamente como você já fazia
      const sku = p.id
      const title = p.title
      const price = p.price
      const status = p.status
      const pictureUrls = p.pictures?.[0]?.url || ''
      const userColor = p.variations?.[0]?.attribute_combinations?.find(a => a.id === 'COLOR')?.value_name || ''
      const diameter = p.attributes?.find(a => a.id === 'DIAMETER')?.value_name || ''
      const available_quantity = p.available_quantity
      const listing = p.listing_type_id
      const condition = p.condition
      const description = p.description
      const video_id = p.video_id
      const warrantyString = p.warranty || ''
      const [warrantyType, warrantyTemp] = warrantyString.split(':').map(s => s.trim())
      const brand = p.attributes?.find(a => a.id === 'BRAND')?.value_name || ''
      const gtin = p.variations?.[0]?.attributes?.find(a => a.id === 'GTIN')?.value_name || ''

      // upload pra Cloudinary
      const buffer = Buffer.from(await fetch(pictureUrls).then(r => r.arrayBuffer()))
      const cloudinaryUrl = await new Promise((ok, ko) => {
        const stream = cloudinary.uploader.upload_stream((err, result) => {
          if (err) return ko(err)
          ok(result.secure_url)
        })
        stream.end(buffer)
      })

      // upsert Prisma
      await prisma.productsMercado.upsert({
        where: {
          product_sku_userId: {
            product_sku: sku,
            userId: userId
          }
        },
        create: {
          product_sku: sku,
          title,
          price,
          status,
          pictureUrls: cloudinaryUrl,
          color: userColor,
          diameter,
          date_created: new Date(p.date_created),
          last_updated: new Date(p.last_updated),
          available_quantity,
          listing,
          condition,
          description,
          video_id,
          warrantyType,
          warrantyTemp,
          brand,
          gtin,
          userId: userId
        },
        update: {
          title,
          price,
          status,
          pictureUrls: cloudinaryUrl,
          color: userColor,
          diameter,
          date_created: new Date(p.date_created),
          last_updated: new Date(p.last_updated),
          available_quantity,
          listing,
          condition,
          description,
          video_id,
          warrantyType,
          warrantyTemp,
          brand,
          gtin
        }
      })
    }

    return res.status(200).json({ message: 'Produtos sincronizados com sucesso', count: products.length })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: err.message || 'Erro ao sincronizar produtos' })
  }
}

// --- Listar / filtrar produtos via Prisma

export async function mercadoLivreGetProducts(req, res) {
  try {
    const userId = req.user.id
    if (!userId) return res.status(400).json({ message: 'userId obrigatório' })

    const {
      searchTerm,
      searchColumn = 'title',
      precoMin,
      precoMax
    } = req.query

    // build dynamic where
    const where = { userId }
    if (searchTerm) {
      where[searchColumn] = { contains: String(searchTerm), mode: 'insensitive' }
    }
    if (precoMin) {
      where.price = { ...(where.price || {}), gte: Number(precoMin) }
    }
    if (precoMax) {
      where.price = { ...(where.price || {}), lte: Number(precoMax) }
    }

    const products = await prisma.productsMercado.findMany({ where })
    return res.status(200).json({ products })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Erro ao recuperar produtos' })
  }
}

// --- Buscar 1 produto

export async function mercadoLivreGetIdProduct(req, res) {
  try {
    const userId = req.user.id
    const sku    = req.query.sku
    if (!userId || !sku) {
      return res.status(400).json({ message: 'userId e sku obrigatórios' })
    }

    const product = await prisma.productsMercado.findUnique({
      where: {
        product_sku_userId: {
          product_sku: String(sku),
          userId
        }
      }
    })
    return res.status(200).json({ product })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Erro ao buscar produto' })
  }
}
