const express = require('express')
const router = express.Router()
const gestor_formaspago = require('../controllers/formaPagoController')

router.use(express.json())

router.get("/", gestor_formaspago.obtenerFormasPago)
router.post("/", gestor_formaspago.registrarFormaPago)
router.put("/", gestor_formaspago.modificarFormaPago)
router.delete("/", gestor_formaspago.eliminarFormaPago)

module.exports = router