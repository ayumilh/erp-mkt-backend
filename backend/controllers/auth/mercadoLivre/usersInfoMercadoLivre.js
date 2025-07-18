import { PrismaClient } from '@prisma/client'
import { startOfDay, endOfDay } from 'date-fns'

const prisma = new PrismaClient()

const validaIdUserMercado = async (userid) => {
  const recs = await prisma.userMercado.findMany({
    where: { userid: userid },
    select: { user_mercado_id: true }
  })
  if (recs.length === 0) throw new Error('Usuário não encontrado ou token não definido')
  return recs.map(r => r.user_mercado_id)
}


/**
 * Sincroniza as visitas do dia corrente e salva/atualiza no banco
 */
export async function mercadoLivreVisitsSync(req, res) {
  try {
    // se você extrai do token: const userid = getUserId()
    const userid = req.user?.id
    if (!userid) {
      return res.status(400).json({ error: 'Usuário não autenticado' })
    }
    const [ userMercado ] = await validaIdUserMercado(userid)

    // intervalo de hoje
    const now = new Date()
    const date_from = startOfDay(now).toISOString()
    const date_to   = endOfDay(now).toISOString()

    // busca na API
    const resp = await fetch(
      `https://api.mercadolibre.com/users/${userMercado}/items_visits?date_from=${date_from}&date_to=${date_to}`,
      { headers: { 'Authorization': `Bearer ${access_token}` } }
    )
    if (!resp.ok) {
      const err = await resp.json().catch(() => null)
      throw new Error(err?.error_description || 'Erro ao buscar visitas')
    }
    const { total_visits: totalVisits } = await resp.json()

    // conta pedidos no Prisma
    const totalOrders = await prisma.ordersMercado.count({
      where: {
        userid,
        date_created: { gte: date_from, lte: date_to }
      }
    })

    const conversionRate = totalVisits > 0
      ? (totalOrders / totalVisits) * 100
      : 0

    // upsert no Prisma (garanta compound unique em schema):
    await prisma.itemVisitsMercado.upsert({
      where: {
        userId_date_from_date_to: {
          userId:      userid,
          date_from,
          date_to
        }
      },
      update: {
        total_visits:     totalVisits,
        conversion_rate:  conversionRate
      },
      create: {
        userId:           userid,
        date_from,
        date_to,
        total_visits:     totalVisits,
        conversion_rate:  conversionRate
      }
    })

    return res.json({
      message: 'Item visits sincronizadas com sucesso.',
      conversion_rate: conversionRate
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}


/**
 * Retorna as visitas de itens, a partir de hoje
 */
export async function mercadoLivreGetItemVisits(req, res) {
  try {
    // const userid = getUserId()
    const userid = req.user?.id
    if (!userid) {
      return res.status(400).json({ error: 'Usuario não autenticado' })
    }
    const date_from = startOfDay(new Date()).toISOString()

    const visits = await prisma.itemVisitsMercado.findMany({
      where: {
        userId:   userid,
        date_from: { gte: date_from }
      },
      orderBy: {
        date_from: 'desc'
      }
    })

    return res.json({ visits })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: err.message })
  }
}
