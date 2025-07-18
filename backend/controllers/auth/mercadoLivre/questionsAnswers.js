import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../utils/verifyToken.js';

const prisma = new PrismaClient();

// Sincroniza perguntas e respostas do Mercado Livre
export async function mercadoLivreGetQuestionsSync(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Usuário não autenticado.' });

    // Busca IDs dos mercados vinculados e token de acesso
    const userMercados = await prisma.userMercado.findMany({
      where: { userId },
      select: { userMercadoId: true, accessToken: true }
    });
    if (!userMercados.length) throw new Error('ID do Mercado não encontrado.');

    const accessToken = userMercados[0].accessToken;
    const mercadoIds = userMercados.map(u => u.userMercadoId).join(',');

    // Pega todas as perguntas
    const questionsResponse = await fetch(
      `https://api.mercadolibre.com/questions/search?seller_id=${mercadoIds}&sort_fields=date_created&sort_types=DESC&api_version=4`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!questionsResponse.ok) throw new Error('Erro ao buscar perguntas');
    const { questions } = await questionsResponse.json();

    // Processa em lotes
    const batchSize = 5;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      await Promise.all(batch.map(async q => {
        try {
          // Detalhes de quem perguntou
          const userResp = await fetch(
            `https://api.mercadolibre.com/users/${q.from.id}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!userResp.ok) throw new Error('Erro ao obter usuário');
          const userData = await userResp.json();

          const details = {
            questionsId:       q.id,
            dateCreated:       new Date(q.date_created),
            productSku:        q.item_id,
            userMercadoId:     q.seller_id,
            status:            q.status,
            text:              q.text,
            tags:              q.tags,
            deletedFromListing:q.deleted_from_listing,
            hold:              q.hold,
            answerText:        q.answer?.text,
            answerStatus:      q.answer?.status,
            answerDateCreated: q.answer?.date_created ? new Date(q.answer.date_created) : null,
            fromId:            q.from.id,
            nickname:          userData.nickname,
            registrationDate:  userData.registration_date ? new Date(userData.registration_date) : null,
            userId
          };

          const compositeKey = { questionsId: details.questionsId, userId };
          const exists = await prisma.questionsAnswer.findUnique({ where: compositeKey });

          if (exists) {
            await prisma.questionsAnswer.update({
              where: compositeKey,
              data: {
                dateCreated: details.dateCreated,
                productSku: details.productSku,
                userMercadoId: details.userMercadoId,
                status: details.status,
                text: details.text,
                tags: details.tags,
                deletedFromListing: details.deletedFromListing,
                hold: details.hold,
                answerText: details.answerText,
                answerStatus: details.answerStatus,
                answerDateCreated: details.answerDateCreated,
                fromId: details.fromId,
                nickname: details.nickname,
                registrationDate: details.registrationDate
              }
            });
          } else {
            await prisma.questionsAnswer.create({ data: details });
          }
        } catch (err) {
          console.error('Erro ao processar pergunta:', err);
        }
      }));
    }

    res.json({ message: 'Perguntas e respostas sincronizadas com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao processar perguntas', error: err.message });
  }
}

// Busca perguntas com dados de produtos associados
export async function mercadoLivreGetQuestionsAnswersWithProducts(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Usuário não autenticado.' });

    const records = await prisma.questionsAnswer.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            productSku: true,
            title: true,
            price: true,
            availableQuantity: true,
            pictureUrls: true
          }
        }
      },
      orderBy: { answerDateCreated: 'asc' }
    });

    const result = records.map(q => ({
      text: q.text,
      answerDateCreated: q.answerDateCreated,
      answerText: q.answerText,
      questionStatus: q.status,
      nickname: q.nickname,
      registrationDate: q.registrationDate,
      product_sku: q.product.productSku,
      title: q.product.title,
      price: q.product.price,
      availableQuantity: q.product.availableQuantity,
      pictureUrls: q.product.pictureUrls
    }));

    res.json({ questions: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao recuperar perguntas', error: err.message });
  }
}
