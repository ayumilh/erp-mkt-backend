import { Router } from 'express';
import { statisticsRealync, salesstatistics } from '../../utils/statistics.js';

const router = Router();

router.get('/real', statisticsRealync);
router.get('/sales', salesstatistics);

export default router;
