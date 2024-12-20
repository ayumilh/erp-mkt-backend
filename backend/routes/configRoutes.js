const express = require('express');
const configController = require('../controllers/configController.js');

const router = express.Router();

router.post('/enterprise', configController.createCompanyInformation);


module.exports = router;
