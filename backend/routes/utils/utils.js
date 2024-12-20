const express = require('express');
const verifyToken = require('../../utils/verifyToken.js');

const router = express.Router();

router.post('/userId', verifyToken.userId);

module.exports = router;
