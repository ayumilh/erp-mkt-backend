// routes/auth/mercadoLivreRoutes.js
import express from 'express';
import * as authMercadoLivre       from '../../controllers/auth/mercadoLivre/authMercadoLivre.js';
import * as productsMercadoLivre   from '../../controllers/auth/mercadoLivre/productsMercadoLivre.js';
import * as ordersMercadoLivre     from '../../controllers/auth/mercadoLivre/ordersMercadoLivre.js';
import * as questionsAnswers       from '../../controllers/auth/mercadoLivre/questionsAnswers.js';
import * as usersInfoMercadoLivre  from '../../controllers/auth/mercadoLivre/usersInfoMercadoLivre.js';
import * as notaFiscalMercadoLivre from '../../controllers/auth/mercadoLivre/notaFiscalMercadoLivre.js';

const router = express.Router();

// AUTENTICAÇÃO
router.get('/auth',     authMercadoLivre.redirectToMercadoLivreAuth);
router.post('/redirect', authMercadoLivre.mercadoLivreAuth);

// PRODUTOS
// certo
router.get('/productsSync', productsMercadoLivre.mercadoLivreGetProductsSync);
router.get('/products',     productsMercadoLivre.mercadoLivreGetProducts);
router.get('/productid',    productsMercadoLivre.mercadoLivreGetIdProduct);
// router.post(
//   '/criar-anuncio',
//   productsMercadoLivre.upload.single('file'),
//   productsMercadoLivre.mercadoLivreCreateProducts
// );
// router.put('/update-anuncio', productsMercadoLivre.mercadoLivreUpdateProducts);

// PEDIDOS
router.get('/ordersSync', ordersMercadoLivre.mercadoLivreGetAllOrders);
// router.post('/print',     ordersMercadoLivre.mercadoLivreGetPrint);
// router.post('/issueNote', ordersMercadoLivre.mercadoLivrePostNota);

// PEDIDOS TABELAS
router.get('/orders',          ordersMercadoLivre.mercadoLivreGetBdOrders);
// router.get('/orderid-ready',   ordersMercadoLivre.mercadoLivreGetOrdersDetailsId);
// router.get('/issue',           ordersMercadoLivre.mercadoLivreGetApproved);
// router.get('/printed',         ordersMercadoLivre.mercadoLivreGetReadyPrinted);
// router.get('/ready',           ordersMercadoLivre.mercadoLivreGetReady);
// router.get('/delivered',       ordersMercadoLivre.mercadoLivreGetDelivered);

// NOTA FISCAL
router.post('/export-note', notaFiscalMercadoLivre.downloadInvoices);
router.post('/sync-notes',  notaFiscalMercadoLivre.getSyncInvoices);
router.get('/get-notes',    notaFiscalMercadoLivre.getInvoices);

// OUTROS
router.get('/questions',      questionsAnswers.mercadoLivreGetQuestionsSync);
router.get('/get-questions',  questionsAnswers.mercadoLivreGetQuestionsAnswersWithProducts);
router.post('/item-visits',   usersInfoMercadoLivre.mercadoLivreVisitsSync);
router.get('/visits',         usersInfoMercadoLivre.mercadoLivreGetItemVisits);
router.get('/count-orders',   ordersMercadoLivre.mercadoLivreGetCounts);

export default router;
