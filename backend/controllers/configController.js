import prisma from '../prisma/client.js'

export async function createCompanyInformation(req, res) {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ message: 'Usuário não autenticado.' })
  }

  const {
    cnpj,
    serial_number,
    company_name,
    tax_type,
    company_type,
    state_registration,
    email,
    postal_code,
    address,
    address_number,
    neighborhood,
    city,
    state,
  } = req.body

  try {
    const company = await prisma.companyInformation.create({
      data: {
        cnpj,
        serial_number,
        company_name,
        tax_type,
        company_type,
        state_registration,
        email,
        postal_code,
        address,
        address_number,
        neighborhood,
        city,
        state,
        userId,
      },
    })

    return res.status(201).json({
      message: 'Company information added successfully.',
      company, // já traz todos os campos, inclusive serial_number
    })
  } catch (error) {
    console.error('Erro ao criar companyInformation:', error)
    return res
      .status(500)
      .json({ message: 'Failed to add company information to the database.' })
  }
}
