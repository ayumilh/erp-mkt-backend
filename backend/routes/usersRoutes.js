const express = require('express');
const usersController = require('../controllers/usersController.js');
const getUsers = require('../utils/getUsers.js');

const router = express.Router();

// router.get('/', usersController.getAllUsers);
// router.get('/:id', usersController.getUserById);
// router.put('/:id', usersController.updateUser);
// router.delete('/:id', usersController.deleteUser);

//Informações Usuario Get
router.get('/info', getUsers.getUserIdBd);


module.exports = router;
