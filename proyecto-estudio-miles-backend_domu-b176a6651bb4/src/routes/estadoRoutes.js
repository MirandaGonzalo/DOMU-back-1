const express = require('express')
const router = express.Router()
const gestor_estados = require('../controllers/estadoController')

router.use(express.json())

router.get("/:tipo", gestor_estados.obtenerEstadosPorTipo)

module.exports = router