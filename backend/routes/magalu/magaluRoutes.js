const express = require('express');
const authMagalu = require('../../controllers/auth/magalu/authMagalu.js');

const router = express.Router();

router.post('/redirect', authMagalu.magaluAuth);

module.exports = router;
