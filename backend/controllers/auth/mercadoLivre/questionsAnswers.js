const pool = require('../../../bd.js');
const { GetUserId } = require('../../../utils/verifyToken.js');

const validaToken = async (userid) => {

    const result = await pool.query(`SELECT access_token FROM usermercadolivre WHERE userid = ${userid}`);

    if (result.rows.length > 0) {
        const accessToken = result.rows[0].access_token;
        return accessToken;
    } else {
        throw new Error('Usuário não encontrado ou token não definido');
    }
}

const validaIdUserMercado = async (userid) => {

    const result = await pool.query(`SELECT user_mercado_id FROM usermercadolivre WHERE userid = ${userid}`);

    if (result.rows.length > 0) {
        const user_mercado_ids = result.rows.map(row => row.user_mercado_id);
        return user_mercado_ids;
    } else {
        throw new Error('Usuário não encontrado ou token não definido');
    }
}

const mercadoLivreGetQuestionsSync = async (req, res) => {
    try {
        const userid = req.query.userId;
        const user_mercado = await validaIdUserMercado(userid);
        const access_token = await validaToken(userid);

        if (!userid || !user_mercado || !access_token) {
            throw new Error('User ID, Mercado ID, or Access Token is missing.');
        }

        // Função para buscar as perguntas da API do Mercado Livre com um timeout
        const fetchQuestions = async () => {
            const response = await fetch(`https://api.mercadolibre.com/questions/search?seller_id=${user_mercado}&sort_fields=date_created&sort_types=DESC&api_version=4`, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                },
                timeout: 5000 // Timeout para a requisição
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error_description || 'Erro ao buscar perguntas');
            }
            return response.json();
        };

        const questionsData = await fetchQuestions();
        const questions = questionsData.questions;

        // Função para processar um lote de perguntas
        const processQuestionsBatch = async (batch) => {
            await Promise.all(batch.map(async (question) => {
                try {
                    // Obter detalhes do usuário da pergunta
                    const userResponse = await fetch(`https://api.mercadolibre.com/users/${question.from.id}`, {
                        headers: { 'Authorization': `Bearer ${access_token}` },
                        timeout: 5000
                    });
                    
                    if (!userResponse.ok) throw new Error('Erro ao obter detalhes do usuário');

                    const userData = await userResponse.json();
                    const questionDetails = {
                        questions_id: question.id,
                        date_created: new Date(question.date_created),
                        product_sku: question.item_id,
                        user_mercado_id: question.seller_id,
                        status: question.status,
                        text: question.text,
                        tags: question.tags,
                        deleted_from_listing: question.deleted_from_listing,
                        hold: question.hold,
                        answer_text: question.answer?.text,
                        answer_status: question.answer?.status,
                        answer_date_created: question.answer?.date_created ? new Date(question.answer.date_created) : null,
                        from_id: question.from.id,
                        nickname: userData.nickname,
                        registration_date: userData.registration_date ? new Date(userData.registration_date) : null
                    };

                    // Verificar se a pergunta já existe no banco de dados
                    const existingQuestion = await pool.query(
                        'SELECT * FROM questions_answers WHERE questions_id = $1 AND user_id = $2',
                        [questionDetails.questions_id, userid]
                    );

                    if (existingQuestion.rows.length > 0) {
                        // Atualizar pergunta existente
                        const updateQuery = `
                            UPDATE questions_answers SET
                            date_created = $1,
                            product_sku = $2,
                            user_mercado_id = $3,
                            status = $4,
                            text = $5,
                            tags = $6,
                            deleted_from_listing = $7,
                            hold = $8,
                            answer_text = $9,
                            answer_status = $10,
                            answer_date_created = $11,
                            from_id = $12,
                            nickname = $13,
                            registration_date = $14
                            WHERE questions_id = $15 AND user_id = $16
                        `;
                        const updateValues = [
                            questionDetails.date_created, questionDetails.product_sku, questionDetails.user_mercado_id,
                            questionDetails.status, questionDetails.text, questionDetails.tags,
                            questionDetails.deleted_from_listing, questionDetails.hold, questionDetails.answer_text,
                            questionDetails.answer_status, questionDetails.answer_date_created, questionDetails.from_id,
                            questionDetails.nickname, questionDetails.registration_date, questionDetails.questions_id, userid
                        ];

                        await pool.query(updateQuery, updateValues);
                    } else {
                        // Inserir nova pergunta
                        const insertQuery = `
                            INSERT INTO questions_answers (
                                questions_id, date_created, product_sku, user_mercado_id,
                                status, text, tags, deleted_from_listing, hold, answer_text,
                                answer_status, answer_date_created, from_id, user_id,
                                nickname, registration_date
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                        `;
                        const insertValues = [
                            questionDetails.questions_id, questionDetails.date_created, questionDetails.product_sku,
                            questionDetails.user_mercado_id, questionDetails.status, questionDetails.text,
                            questionDetails.tags, questionDetails.deleted_from_listing, questionDetails.hold,
                            questionDetails.answer_text, questionDetails.answer_status, questionDetails.answer_date_created,
                            questionDetails.from_id, userid, questionDetails.nickname, questionDetails.registration_date
                        ];

                        await pool.query(insertQuery, insertValues);
                    }

                } catch (error) {
                    console.error('Erro ao processar pergunta:', error);
                }
            }));
        };

        // Processar as perguntas em lotes para evitar sobrecarga
        const batchSize = 5;
        for (let i = 0; i < questions.length; i += batchSize) {
            const batch = questions.slice(i, i + batchSize);
            await processQuestionsBatch(batch);
        }

        res.status(200).json({ message: 'Perguntas e respostas sincronizadas com sucesso' });

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao processar a solicitação de Perguntas.', error: error.message });
    }
};

const mercadoLivreGetQuestionsAnswersWithProducts = async (req, res) => {
    try {
        
        const userid = req.query.userId;
        console.log('UserId recebido:', userid);

        // Consulta SQL
        const query = `
            SELECT 
                q.text,
                q.answer_date_created,
                q.answer_text,
                q.status AS question_status,
                q.nickname,
                q.registration_date,
                p.product_sku,
                p.title,
                p.price,
                p.available_quantity,
                p.pictureUrls
            FROM 
                questions_answers q
            JOIN 
                productsMercado p
            ON 
                q.product_sku = p.product_sku
            WHERE 
                q.user_id = $1
            ORDER BY 
                q.answer_date_created;
        `;

        // Executa a consulta
        const result = await pool.query(query, [userid]);

        // Log do resultado para análise
        console.log('Resultado da consulta:', result.rows);
        // Retorna os resultados
        res.status(200).json({ questions: result.rows });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar as perguntas e respostas do banco de dados.' });
    }
};

module.exports = {
    mercadoLivreGetQuestionsSync,
    mercadoLivreGetQuestionsAnswersWithProducts
};

