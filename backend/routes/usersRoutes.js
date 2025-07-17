// src/routes/usersRoutes.js
import { Router } from 'express';
import * as usersController from '../controllers/usersController.js';
import { getUserIdBd } from '../utils/getUsers.js';

const router = Router();

// Se for reabilitar outras rotas, basta descomentar:
// router.get('/', usersController.getAllUsers);
// router.get('/:id', usersController.getUserById);
// router.put('/:id', usersController.updateUser);
// router.delete('/:id', usersController.deleteUser);

// Informações do usuário
router.get('/info', getUserIdBd);

export default router;
