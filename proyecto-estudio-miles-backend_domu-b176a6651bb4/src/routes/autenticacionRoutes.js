const express = require('express');
const { login } = require('../controllers/autenticacionController');
const router = express.Router();




// Login de usuario
router.post('/login', login);


// Registro de usuario
//router.post('/register', register);
  

module.exports = router;
