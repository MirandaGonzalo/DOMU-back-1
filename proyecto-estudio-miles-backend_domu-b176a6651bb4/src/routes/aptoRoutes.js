const express = require('express')
const router = express.Router()
const gestor_aptos = require('../controllers/aptoController')

router.use(express.json())

router.get('/', gestor_aptos.obtenerAptos);

module.exports = router