const express = require('express')
const router = express.Router()
const gestor_inmueble_x_persona = require('../controllers/inmueble_x_personaController')

router.use(express.json())

router.get("", gestor_inmueble_x_persona.obtenerInmueblesXPersona)

module.exports = router