const express = require('express');
const authMercadoLivre = require('../../controllers/auth/mercadoLivre/authMercadoLivre.js');
const productsMercadoLivre = require('../../controllers/auth/mercadoLivre/productsMercadoLivre.js');
const ordersMercadoLivre = require('../../controllers/auth/mercadoLivre/ordersMercadoLivre.js');
const questionsAnswers = require('../../controllers/auth/mercadoLivre/questionsAnswers.js');
const usersInfoMercadoLivre = require('../../controllers/auth/mercadoLivre/usersInfoMercadoLivre.js');
const notaFiscalMercadoLivre = require('../../controllers/auth/mercadoLivre/notaFiscalMercadoLivre.js');

const router = express.Router();

// AUTENTICAÇÃO
router.get('/auth', authMercadoLivre.redirectToMercadoLivreAuth);
router.post('/redirect', authMercadoLivre.mercadoLivreAuth); //passei

// PRODUTOS
router.get('/productsSync', productsMercadoLivre.mercadoLivreGetProductsSync); //passei
router.get('/products', productsMercadoLivre.mercadoLivreGetProducts); //passei
router.get('/productid', productsMercadoLivre.mercadoLivreGetIdProduct); //passei
router.post('/criar-anuncio', productsMercadoLivre.upload.single('file'), productsMercadoLivre.mercadoLivreCreateProducts);
router.put('/update-anuncio', productsMercadoLivre.mercadoLivreUpdateProducts);

// PEDIDOS
router.get('/ordersSync', ordersMercadoLivre.mercadoLivreGetAllOrders); //passei
router.post('/print', ordersMercadoLivre.mercadoLivreGetPrint); //passei
router.post('/issueNote', ordersMercadoLivre.mercadoLivrePostNota);
// router.get('/orderId', ordersMercadoLivre.mercadoLivreGetIdOrders); //PEDIDOS POR ID

//PEDIDOS TABELAS
router.get('/orders', ordersMercadoLivre.mercadoLivreGetBdOrders); //Todos  //passei
router.get('/orderid-ready', ordersMercadoLivre.mercadoLivreGetOrdersDetailsId); //Todos  //passei
router.get('/issue', ordersMercadoLivre.mercadoLivreGetApproved); // Emitir //passei
router.get('/printed', ordersMercadoLivre.mercadoLivreGetReadyPrinted); //Retirada  //passei
router.get('/ready', ordersMercadoLivre.mercadoLivreGetReady); //para Imprimir  //passei 
router.get('/delivered', ordersMercadoLivre.mercadoLivreGetDelivered); //Enviado ou Entregue  //passei

//NOTA FISCAL
router.post('/export-note', notaFiscalMercadoLivre.downloadInvoices); //Todos  //passei
router.post('/sync-notes', notaFiscalMercadoLivre.getSyncInvoices); //Todos   //passei
router.get('/get-notes', notaFiscalMercadoLivre.getInvoices); //Todos   //passei
// router.post('/post-note', notaFiscalMercadoLivre.mercadoLivreProcessNotes); //Todos 

//OUTROS
router.get('/questions', questionsAnswers.mercadoLivreGetQuestionsSync); //Todos 
router.get('/get-questions', questionsAnswers.mercadoLivreGetQuestionsAnswersWithProducts); //Todos 
router.post('/item-visits', usersInfoMercadoLivre.mercadoLivreVisitsSync); //Todos 
router.get('/visits', usersInfoMercadoLivre.mercadoLivreGetItemVisits); //Todos 
router.get('/count-orders', ordersMercadoLivre.mercadoLivreGetCounts); //Todos 



module.exports = router;
