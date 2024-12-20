const express = require('express');
const authController = require('../controllers/authController.js');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/change-password', authController.changePassword);

module.exports = router;
