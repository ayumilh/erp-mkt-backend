// src/routes/authRoutes.js
import { Router } from 'express';
import { setUserId } from '../../utils/verifyToken.js';

const router = Router();

// salva o userId recebido no corpo da requisição
router.post('/userId', setUserId);

export default router;
