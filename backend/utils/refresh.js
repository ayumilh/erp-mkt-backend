import cron from 'node-cron'
import dotenv from 'dotenv'
import prisma from '../prisma/client.js'
dotenv.config()

// ── MercadoLibre ────────────────────────────────────────────────────────────────
export async function atualizarRefreshTokenMercadoLivre() {
  try {
    const records = await prisma.userMercado.findMany({
      select: { user_mercado_id: true, refresh_token: true, access_token: true }
    })

    for (const { user_mercado_id, refresh_token } of records) {
      const res = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id:  process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          refresh_token,
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error_description || 'Falha ao atualizar token ML')
      }

      const { refresh_token: newRefresh, access_token: newAccess } =
        await res.json()

      await prisma.userMercado.update({
        where: { user_mercado_id },
        data: {
          refresh_token: newRefresh,
          access_token:  newAccess
        }
      })

      console.log(
        'ML tokens updated for',
        user_mercado_id,
        '→',
        newRefresh,
        newAccess
      )
    }
  } catch (e) {
    console.error('Erro ML refresh:', e)
  }
}

// ── Magalu ──────────────────────────────────────────────────────────────────────
export async function atualizarRefreshTokenMagalu() {
  try {
    const records = await prisma.userMagalu.findMany({
      select: { user_magalu_id: true, refresh_token: true }
    })

    for (const { user_magalu_id, refresh_token } of records) {
      const res = await fetch('https://id.magalu.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:     process.env.CLIENT_ID_MAGALU,
          client_secret: process.env.CLIENT_SECRET_MAGALU,
          grant_type:    'refresh_token',
          refresh_token
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error_description || 'Falha no token Magalu')
      }

      const { refresh_token: newRefresh, access_token: newAccess } =
        await res.json()

      await prisma.userMagalu.update({
        where: { user_magalu_id },
        data: {
          refresh_token: newRefresh,
          access_token:  newAccess
        }
      })

      console.log(
        'Magalu tokens updated for',
        user_magalu_id,
        '→',
        newRefresh,
        newAccess
      )
    }
  } catch (e) {
    console.error('Erro Magalu refresh:', e)
  }
}

// ── Shopee ──────────────────────────────────────────────────────────────────────
export async function atualizarRefreshTokenShopee() {
  try {
    const records = await prisma.userShopee.findMany({
      select: { user_shop_id: true, refresh_token: true }
    })

    for (const { user_shop_id, refresh_token } of records) {
      const res = await fetch(
        'https://partner.shopeemobile.com/api/v2/auth/access_token/get',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partner_id:  process.env.SHOPEE_PARTNER_ID,
            shop_id:     process.env.SHOPEE_SHOP_ID,
            refresh_token
          })
        }
      )

      if (!res.ok) {
        const err = await res.json()
        console.error('Erro Shopee token:', err)
        continue
      }

      const { refresh_token: newRefresh, access_token: newAccess } =
        await res.json()

      await prisma.userShopee.update({
        where: { user_shop_id },
        data: {
          refresh_token: newRefresh,
          access_token:  newAccess
        }
      })

      console.log(
        'Shopee tokens updated for',
        user_shop_id,
        '→',
        newRefresh,
        newAccess
      )
    }
  } catch (e) {
    console.error('Erro Shopee refresh:', e)
  }
}

// ── Cron schedule ───────────────────────────────────────────────────────────────
cron.schedule('0 */5 * * *', () => {
  console.log('Running token refresher…')
  atualizarRefreshTokenMercadoLivre()
  atualizarRefreshTokenMagalu()
  atualizarRefreshTokenShopee()
})
