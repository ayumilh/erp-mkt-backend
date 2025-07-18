import prisma from '../prisma/client.js'

export async function getAllUsers(req, res) {
  try {
    const users = await prisma.user.findMany()
    return res.status(200).json(users)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao buscar usuários.' })
  }
}

export async function getUserById(req, res) {
  try {
    const { id } = req.params
    const user = await prisma.user.findUnique({
      where: { id }   // id é string agora
    })
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' })
    }
    return res.status(200).json(user)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao buscar o usuário.' })
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params
    const { email, senha, data_nascimento, telefone, cnpj } = req.body

    await prisma.user.update({
      where: { id },   // sem Number()
      data: {
        email,
        senha,
        data_nascimento: data_nascimento ? new Date(data_nascimento) : undefined,
        telefone,
        cnpj
      }
    })

    return res.status(200).json({ message: 'Usuário atualizado com sucesso.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao atualizar o usuário.' })
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params
    await prisma.user.delete({
      where: { id }  // sem Number()
    })
    return res.status(200).json({ message: 'Usuário excluído com sucesso.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao excluir o usuário.' })
  }
}
