import express from 'express';
import { magaluAuth } from '../../controllers/auth/magalu/authMagalu.js';

const router = express.Router();

router.post('/redirect', magaluAuth);

export default router;
