import dotenv from 'dotenv'
dotenv.config()

import { format, startOfDay, subDays } from 'date-fns'
import fs from 'fs'
import path from 'path'

// import e instanciação do Prisma Client
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()


const validaToken = async (userid) => {
  const record = await prisma.userMercado.findUnique({
    where: { userid: userid },
    select: { access_token: true }
  })
  if (!record) throw new Error('Usuário não encontrado ou token não definido')
  return record.access_token
}

const validaIdUserMercado = async (userid) => {
  const records = await prisma.userMercado.findMany({
    where: { userid: userid },
    select: { user_mercado_id: true }
  })
  if (records.length === 0) throw new Error('Usuário não encontrado ou token não definido')
  return records.map(r => r.user_mercado_id)
}


// 1) downloadInvoices
export async function downloadInvoices(req, res) {
  try {
    const userid = req.user?.id
    if (!userid) {
      return res.status(400).json({ error: 'Usuario não autenticado.' })
    }
    const startInt = parseInt(req.body.start, 10)
    const endInt   = parseInt(req.body.end, 10)
    if (isNaN(startInt)||isNaN(endInt)) {
      return res.status(400).json({ error: 'Start and end must be integers.' })
    }

    const [ userMercado ] = await validaIdUserMercado(userid)
    const access_token = await validaToken(userid)
    const url = `https://api.mercadolibre.com/users/${userMercado}/invoices/sites/MLB/batch_request/period/stream?start=${startInt}&end=${endInt}`

    const response = await fetch(url,{
      headers:{ 'Authorization': `Bearer ${access_token}` }
    })
    if (!response.ok) {
      const txt = await response.text()
      return res.status(response.status).send(txt)
    }
    const buffer = Buffer.from(await response.arrayBuffer())

    // salva em /tmp
    const outputFolder = path.join('/tmp','emitidas_mercado_livre')
    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true })
    const filePath = path.join(outputFolder, `invoices_${startInt}_to_${endInt}.zip`)
    fs.writeFileSync(filePath, buffer)

    res.setHeader('Content-Disposition', `attachment; filename="invoices_${startInt}_to_${endInt}.zip"`)
    res.setHeader('Content-Type','application/zip')
    return res.sendFile(filePath)
  } catch(err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}


// 2) mercadoLivreProcessNotes
export async function mercadoLivreProcessNotes(req, res) {
  try {
    const userid = req.user?.id
    if (!userid) {
      return res.status(400).json({ error: 'Usuario não autenticado.' })
    }
    const userMercado = (await validaIdUserMercado(userid))[0]
    const access_token = await validaToken(userid)

    // busca no Prisma
    const orders = await prisma.ordersMercado.findMany({
      where: {
        userid,
        OR: [
          { status: 'shipped' },
          { AND: [ { status: 'ready_to_ship' }, { substatus: 'picked_up' } ] }
        ]
      },
      select: { order_id: true }
    })

    for (const { order_id } of orders) {
      const resp = await fetch(
        `https://api.mercadolibre.com/users/${userMercado}/invoices/orders/${order_id}`,
        { method:'GET', headers:{ 'Authorization':`Bearer ${access_token}` } }
      )
      if (resp.ok) {
        console.log(`Pedido ${order_id}:`, await resp.json())
      } else {
        console.warn(`Falha em ${order_id}:`, resp.statusText)
      }
    }

    return res.json({ message: 'Notas processadas com sucesso.' })
  } catch(err) {
    console.error(err)
    return res.status(500).json({ message: err.message })
  }
}


// 3) getSyncInvoices
export async function getSyncInvoices(req, res) {
  try {
    const userid = req.user?.id
    if (!userid) {
      return res.status(400).json({ error: 'Usuario não autenticado.' })
    }

    const access_token = await validaToken(userid)
    const userMercado = (await validaIdUserMercado(userid))[0]

    const currentDate = startOfDay(new Date())
    const tenDaysAgo  = startOfDay(subDays(currentDate,9))
    const firstDay = format(tenDaysAgo, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    const lastDay  = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")

    // busca pedidos sem issue e sem invoice_pending
    const pending = await prisma.ordersMercado.findMany({
      where:{
        userid,
        date_created: { gte: firstDay, lte: lastDay },
        status_simc: { not: 'issue' },
        substatus:   { not: 'invoice_pending' }
      },
      select:{ order_id: true }
    })

    if (!pending.length) {
      return res.json({ message: 'Nenhum pedido pendente nos últimos 10 dias.' })
    }

    for (const { order_id } of pending) {
      const apiUrl = `https://api.mercadolibre.com/users/${userMercado}/invoices/orders/${order_id}`
      try {
        const resp = await fetch(apiUrl,{
          method:'GET',
          headers:{
            'Authorization':`Bearer ${access_token}`,
            'Content-Type':'application/json'
          }
        })
        if (!resp.ok) throw new Error(await resp.text())
        const data = await resp.json()
        const invoice_id  = data.items[0]?.invoice_id
        const invoice_key = data.attributes?.invoice_key

        if (invoice_id && invoice_key) {
          await prisma.ordersMercado.update({
            where:{ order_id_userid: { order_id, userid } },
            data:{ invoice_id, invoice_key }
          })
          console.log(`Atualizado ${order_id}`)
        }
      } catch(e){
        console.warn(`Erro em ${order_id}:`, e.message)
      }
    }

    return res.json({ message: 'Notas sincronizadas com sucesso.' })
  } catch(err){
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}


// 4) getInvoices
export async function getInvoices(req, res) {
  try {
    const userid = req.user?.id
    if (!userid) {
      return res.status(400).json({ error: 'Usuario nao autenticado.' })
    }
    const invoices = await prisma.ordersMercado.findMany({
      where: {
        userid,
        AND: [
          { invoice_key: { not: null } },
          { invoice_key: { not: ''   } }
        ]
      },
      orderBy: { date_created: 'desc' },
      select:{
        invoice_id:    true,
        invoice_key:   true,
        receiver_name: true,
        total_paid_amount: true,
        pack_id:       true
      }
    })

    // mapeia para o formato desejado
    const formatted = invoices.map(i => ({
      numero:     i.invoice_id,
      chave:      i.invoice_key,
      tipo:       'normal',
      cliente:    i.receiver_name,
      Valor_Nota_Fisc: i.total_paid_amount,
      pedido:     i.pack_id,
      tempo:      'em and',
      estado:     'emitido'
    }))

    return res.json({ orders: formatted })
  } catch(err){
    console.error(err)
    return res.status(500).json({ message: err.message })
  }
}
