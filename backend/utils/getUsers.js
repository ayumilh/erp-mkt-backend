import dotenv from 'dotenv'
import prisma from '../prisma/client.js'
dotenv.config()

export async function getUserIdBd(req, res) {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ message: 'Usuário não autenticado.' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' })
    }

    return res.status(200).json({ user })
  } catch (error) {
    console.error('Erro ao recuperar usuário do banco:', error)
    return res
      .status(500)
      .json({ message: 'Erro ao recuperar os usuários do banco de dados.' })
  }
}
