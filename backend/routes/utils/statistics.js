const express = require('express');
const statistics = require('../../utils/statistics.js');

const router = express.Router();

router.get('/real', statistics.statisticsReal);
router.get('/sales', statistics.salesstatistics);

module.exports = router;
