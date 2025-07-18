import dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const redirectUri = process.env.REDIRECT_URI

// PASSO 1: redireciona para a autenticação do Mercado Livre
export async function redirectToMercadoLivreAuth(req, res) {
  try {
    const encoded = encodeURIComponent(redirectUri)
    const url = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encoded}`
    res.redirect(url)
  } catch (err) {
    console.error('Erro na geração da URL ML:', err)
    res.status(500).json({ message: 'Erro ao gerar URL de autenticação.' })
  }
}

// PASSO 2: troca o code por tokens e armazena em userMercado
export async function mercadoLivreAuth(req, res) {
  try {
    const { code, nome_loja: nomeMercado, userId } = req.body
    const faltantes = []
    if (!code) faltantes.push('code')
    if (!nomeMercado) faltantes.push('nome_loja')
    if (!userId) faltantes.push('userId')
    if (faltantes.length) {
      return res.status(400).json({
        message: `Parâmetros ausentes: ${faltantes.join(', ')}`
      })
    }

    // solicita o token
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    })

    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    })
    if (!tokenRes.ok) {
      const err = await tokenRes.json()
      throw new Error(err.error_description || 'Falha ao obter token')
    }

    const { user_id: mercadoId, refresh_token, access_token } = await tokenRes.json()

    // verifica existência
    const existente = await prisma.userMercado.findUnique({ where: { userMercadoId: mercadoId } })
    if (existente) {
      return res.status(409).json({ message: 'Usuário já cadastrado.' })
    }

    // cria novo registro
    await prisma.userMercado.create({
      data: {
        nomeMercado,
        refreshToken: refresh_token,
        accessToken: access_token,
        userId: userId,
        userMercadoId: mercadoId
      }
    })

    res.status(200).json({ message: 'Credenciais ML salvas com sucesso.' })
  } catch (err) {
    console.error('Erro no fluxo ML Auth:', err)
    if (err.message.includes('Usuário já cadastrado')) {
      res.status(409).json({ message: err.message })
    } else {
      res.status(500).json({ message: 'Erro interno. Tente novamente mais tarde.' })
    }
  }
}
