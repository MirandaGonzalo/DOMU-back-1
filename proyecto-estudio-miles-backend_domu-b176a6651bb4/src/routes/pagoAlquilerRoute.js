const express = require('express')
const router = express.Router()
const gestor_pago_alquiler = require('../controllers/pagoAlquilerController')

router.use(express.json())

router.post("/devengar", gestor_pago_alquiler.devengarAlquiler)
router.post("/precio", gestor_pago_alquiler.obtenerPrecioAlquiler)
router.get("/datos/:id", gestor_pago_alquiler.obtenerDatosDevengar)
router.get("/detalle/:id", gestor_pago_alquiler.obtenerDetallePagoAlquiler)
router.get("/pago/:id", gestor_pago_alquiler.obtenerDatosRegistrarPago)
router.get("/:id", gestor_pago_alquiler.getPagosAlquiler)
router.post("/registrar-pago", gestor_pago_alquiler.registrarPagoAlquiler)
router.post("/paga-inmobiliaria", gestor_pago_alquiler.completarPagoInmobiliaria)
router.get("/precio-servicios/:id", gestor_pago_alquiler.obtenerServiciosModificarMonto)
router.post("/precio-montos", gestor_pago_alquiler.modificarMontoServicios)

module.exports = router