// src/routes/stock/stockRoutes.js
import { Router } from 'express';
import * as stockController from '../../controllers/stock/stockController.js';
import * as utilsStockController from '../../controllers/stock/utilsStockController.js';
import * as syncStockMercadoLivre from '../../controllers/auth/mercadoLivre/syncStock.js';

const router = Router();

// Produto Estoque
router.post('/createProduct', stockController.productStock);
router.get('/products', stockController.getProductStock);
router.put('/update/products', stockController.editProductStock);
router.get('/products/:sku', utilsStockController.getProductByIdSKU);

// Variações e Kits
router.post('/productsVari', stockController.productVariStockVariant);
router.post('/productskit', stockController.productKitStock);

// Utils Estoque
router.get('/products/search', utilsStockController.searchProducts);
router.get('/product/get', utilsStockController.getProductSolo);

// Sync Estoque Mercado Livre
router.get('/mercadolivre/get', syncStockMercadoLivre.syncMercadoLivreStock);
router.post('/mercadolivre/sync', syncStockMercadoLivre.productStockMercado);

export default router;
