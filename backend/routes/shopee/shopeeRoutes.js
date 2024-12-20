const express = require('express');
const authShopee = require('../../controllers/auth/shopee/authShopee.js');
const productsShopee = require('../../controllers/auth/shopee/productsShopee.js');

const router = express.Router();

// AUTENTICAÇÃO
// router.get('/auth', authShopee.redirectToShopeeAuth);
router.post('/redirect', authShopee.shopeeAuth); //passei

//Produtos
router.get('/productsSync', productsShopee.shopeeGetProductsSync);






module.exports = router;
