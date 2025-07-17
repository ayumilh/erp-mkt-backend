import { Router } from 'express';
import { shopeeAuth } from '../../controllers/auth/shopee/authShopee.js';
import { shopeeGetProductsSync } from '../../controllers/auth/shopee/productsShopee.js';

const router = Router();

// Autenticação
router.post('/redirect', shopeeAuth);

// Produtos
router.get('/productsSync', shopeeGetProductsSync);

export default router;
