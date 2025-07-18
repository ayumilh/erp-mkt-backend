import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helpers
async function validaToken(userId) {
  const rec = await prisma.userMercado.findFirst({
    where: { userId: userId },
    select: { access_token: true }
  })
  if (!rec?.access_token) throw new Error('Usuário não encontrado ou token não definido')
  return rec.access_token
}

async function validaIdUserMercado(userId) {
  const recs = await prisma.userMercado.findMany({
    where: { userId: userId },
    select: { user_mercado_id: true }
  })
  if (!recs.length) throw new Error('Usuário não encontrado ou token não definido')
  return recs.map(r => r.user_mercado_id)
}

// SYNC PEDIDOS MERCADO LIVRE
export async function mercadoLivreGetAllOrders(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(400).json({ message: 'userId é obrigatório' })

    const userMercado = await validaIdUserMercado(userId)
    const access_token = await validaToken(userId)

    const ordersData = []
    for (const mlId of userMercado) {
      const response = await fetch(
        `https://api.mercadolibre.com/orders/search?seller=${mlId}&sort=date_desc`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
      if (!response.ok) {
        const err = (await response.json()).error_description || 'Erro na solicitação'
        throw new Error(err)
      }
      const body = await response.json()
      ordersData.push(...body.results)
    }

    // Flatten and enrich
    const data = []
    for (const order of ordersData) {
      for (const pay of order.payments) {
        const detail = {
          order_id: pay.order_id,
          reason: pay.reason,
          total_paid_amount: pay.total_paid_amount,
          buyer_nickname: order.buyer.nickname,
          date_last_modified: pay.date_last_modified,
          total_amount: order.total_amount,
          date_created: order.date_created,
          seller_nickname: order.seller.nickname,
          status: pay.status,
          pack_id: order.pack_id,
          quantity: order.order_items.reduce((a,i)=>(a+i.quantity),0),
          shipping_id: order.shipping.id,
          product_sku: order.order_items[0].item.id,
          unit_price: order.order_items[0].unit_price,
          sale_fee: order.order_items[0].sale_fee,
          color_name: order.order_items[0].item.variation_attributes
            .filter(a=>a.id==='COLOR').map(a=>a.value_name).join(', ')
        }
        data.push(detail)
      }
    }

    // Enriquecer com pictureUrls e shipping_data e upsert no Prisma
    for (const o of data) {
      const prodResp = await fetch(`https://api.mercadolibre.com/items/${o.product_sku}`, { headers:{ Authorization:`Bearer ${access_token}` } })
      const prodBody = await prodResp.json()
      o.pictureUrls = prodBody.pictures[0]?.url || null

      const shipResp = await fetch(`https://api.mercadolibre.com/shipments/${o.shipping_id}`, { headers:{ Authorization:`Bearer ${access_token}` } })
      const shipBody = await shipResp.json()
      o.shipping_data = {
        tracking_number: shipBody.tracking_number,
        tracking_method: shipBody.tracking_method,
        street_name: shipBody.receiver_address.street_name,
        receiver_name: shipBody.receiver_address.receiver_name,
        address_line: shipBody.receiver_address.address_line,
        neighborhood: shipBody.receiver_address.neighborhood.name,
        city: shipBody.receiver_address.city.name,
        state: shipBody.receiver_address.state.name,
        zip_code: shipBody.receiver_address.zip_code,
        country: shipBody.receiver_address.country.id,
        status: shipBody.status,
        list_cost: shipBody.list_cost,
        substatus: shipBody.substatus
      }

      // upsert no Prisma
      await prisma.ordersMercado.upsert({
        where: { order_id_userId: { order_id: o.order_id, userId: userId } },
        create: { ...o, userId: userId },
        update: { ...o }
      })
    }

    // Bulk update status_simc for conditions
    await prisma.ordersMercado.updateMany({
      where: {
        userId: req.user?.id,
        status: 'ready_to_ship',
        OR: [
          { substatus: 'ready_to_print', tracking_method: 'VAJU6732707 Super Express' },
          { substatus: 'invoice_pending' }
        ],
        status_simc: ''
      },
      data: { status_simc: 'issue' }
    })

    res.status(200).json({ message: 'Pedidos sincronizados', count: data.length })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message })
  }
}

// CONTADORES USANDO PRISMA
export async function mercadoLivreGetCounts(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(400).json({ message: 'userId obrigatório' })

    const [
      all, approved, ready, readyPrinted, delivered
    ] = await Promise.all([
      prisma.ordersMercado.count({ where: { userId } }),
      prisma.ordersMercado.count({ where: { userId, status: 'ready_to_ship', substatus: 'invoice_pending' }}),
      prisma.ordersMercado.count({ where: { userId, status: 'ready_to_ship', substatus: 'ready_to_print' }}),
      prisma.ordersMercado.count({ where: { userId, status: 'ready_to_ship', substatus: 'printed' }}),
      prisma.ordersMercado.count({
        where: {
          userId,
          OR: [
            { status: 'delivered' },
            { status: 'ready_to_ship', substatus: 'picked_up' },
            { status: 'ready_to_ship', substatus: 'in_hub' }
          ]
        }
      })
    ])

    res.json({ all, approved, ready, readyPrinted, delivered })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erro ao buscar contagens' })
  }
}

// FILTROS BÁSICOS NO BD
export async function mercadoLivreGetBdOrders(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(400).json({ message: 'userId obrigatório' })

    const { searchTerm, searchColumn = 'buyer_nickname', precoMin, precoMax } = req.query

    const filters = { userId }
    if (searchTerm) filters[searchColumn] = { contains: String(searchTerm), mode: 'insensitive' }
    if (precoMin) filters.total_paid_amount = { ...(filters.total_paid_amount||{}), gte: Number(precoMin) }
    if (precoMax) filters.total_paid_amount = { ...(filters.total_paid_amount||{}), lte: Number(precoMax) }

    const orders = await prisma.ordersMercado.findMany({ where: filters, orderBy: { date_created: 'desc' } })
    res.json({ orders })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erro ao buscar pedidos no BD' })
  }
}
