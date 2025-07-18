import prisma from '../prisma/client.js'

// Função para obter estatísticas de pedidos
export async function salesstatistics(req, res) {
  const userId = req.user?.id 
  if (!userId) {
    return res.status(401).json({ message: 'Usuário não autenticado.' })
  }

  try {
    const statistics = await prisma.$queryRaw`
      SELECT 
        DATE(date_created) AS "Data",
        COUNT(order_id) AS "Total de Pedidos",
        SUM(total_paid_amount) AS "Valor Total de Vendas",
        COUNT(CASE WHEN status != 'cancelled' THEN 1 END) AS "Pedidos Válidos",
        SUM(CASE WHEN status != 'cancelled' THEN total_paid_amount ELSE 0 END) AS "Valor de Vendas Válidas",
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS "Pedidos Cancelados",
        SUM(CASE WHEN status = 'cancelled' THEN total_paid_amount ELSE 0 END) AS "Valor de Vendas Canceladas",
        COUNT(DISTINCT buyer_nickname) AS "Clientes",
        ROUND(SUM(total_paid_amount) / NULLIF(COUNT(DISTINCT buyer_nickname), 0), 2) AS "Vendas por Cliente"
      FROM ordersmercado
      WHERE userid = ${userId}
      GROUP BY DATE(date_created)
      ORDER BY DATE(date_created) DESC
    `
    return res.status(200).json({ statistics })
  } catch (error) {
    console.error('Erro ao recuperar estatísticas de vendas:', error)
    return res
      .status(500)
      .json({ message: 'Erro ao recuperar as estatísticas dos pedidos.' })
  }
}

// Função para obter detalhes de vendas Realync
export async function statisticsRealync(req, res) {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ message: 'Usuário não autenticado.' })
  }

  try {
    const orders = await prisma.$queryRaw`
      SELECT 
        ped.date_created AS "Data de pedido",
        'Em And'                 AS "Status",
        ped.order_id             AS "Pedido",
        'LENE MODAS'             AS "Loja",
        ped.total_amount         AS "Valor do Pedido",
        (ped.total_amount - (ped.total_amount * 0.20) - 3) AS "Receita",
        pro.price                AS "Vendas de Produtos",
        ped.list_cost            AS "Taxa de Frete Comprador",
        (ped.total_amount * 0.20 + 3)           AS "Desconto e Subsídio",
        ((ped.total_amount * 0.20) - 3)         AS "Comissão",
        ''                           AS "Taxa de Transação",
        ''                           AS "Taxa de Serviço",
        ped.sale_fee                 AS "Taxa do Frete",
        '0'                          AS "Taxa de ADS",
        '0'                          AS "Outra Taxa da Plataforma",
        ''                           AS "Reembolso do Comprador",
        'Em And'                     AS "Lucro",
        'Em and'                     AS "Margem de Lucro"
      FROM ordersmercado ped
      INNER JOIN productsmercado pro
        ON ped.product_sku = pro.product_sku
      WHERE ped.userid = ${userId}
      ORDER BY ped.date_created DESC
    `
    return res.status(200).json({ orders })
  } catch (error) {
    console.error('Erro ao recuperar pedidos Realync:', error)
    return res
      .status(500)
      .json({ message: 'Erro ao recuperar os pedidos do banco de dados.' })
  }
}
