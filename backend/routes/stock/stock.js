const express = require('express');
const stockController = require('../../controllers/stock/stockController.js');
const utilsStockController = require('../../controllers/stock/utilsStockController.js')
const syncStockMercadoLivre = require('../../controllers/auth/mercadoLivre/syncStock.js');
const router = express.Router();

//Produto Estoque
router.post('/createProduct', stockController.productStock);
router.get('/products', stockController.getProductStock);
router.put('/update/products', stockController.editProductStock);
router.get('/products/:sku', utilsStockController.getProductByIdSKU); //Utils Stock


router.post('/productsVari', stockController.productVariStockVariant);
router.post('/productskit', stockController.productKitStock);


//utils Estoque
router.get('/products/search', utilsStockController.searchProducts); //Utils Stock
router.get('/product/get', utilsStockController.getProductSolo); //Utils Stock

//Sync Estoque
router.get('/mercadolivre/get', syncStockMercadoLivre.syncMercadoLivreStock); //Sync mercado livre
router.post('/mercadolivre/sync', syncStockMercadoLivre.productStockMercado); //Sync mercado livre

module.exports = router;