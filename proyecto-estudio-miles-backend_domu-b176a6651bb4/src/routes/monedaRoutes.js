const express = require('express')
const router = express.Router()
const gestor_monedas = require('../controllers/monedaController')

router.use(express.json())

router.get('/', gestor_monedas.getMonedas);

module.exports = router