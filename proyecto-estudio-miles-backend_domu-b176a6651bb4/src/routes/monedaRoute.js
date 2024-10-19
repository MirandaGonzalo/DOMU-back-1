const express = require('express')
const router = express.Router()
const gestor_monedas = require('../controllers/monedaController')

router.use(express.json())

router.get("/", gestor_monedas.getMonedas)
router.post("/", gestor_monedas.registrarMoneda)
router.put("/", gestor_monedas.modificarMoneda)
router.delete("/", gestor_monedas.eliminarMoneda)

module.exports = router