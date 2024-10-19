const express = require('express')
const router = express.Router()
const gestor_liquidacion = require('../controllers/liquidacionController')

router.use(express.json())
router.get("/propietarios", gestor_liquidacion.getListadoLiquidacionesPendientes)
router.get("/propietarios/detalle/", gestor_liquidacion.obtenerDetalleLiquidacionPendiente)
router.get("/historico/:dni", gestor_liquidacion.getHistorialLiquidaciones)
router.get("/historico/detalle/:id", gestor_liquidacion.obtenerDetalleLiquidacionHistorica)
router.get("/datos", gestor_liquidacion.obtenerDatosRegistrarLiquidacion)
router.post("/", gestor_liquidacion.registrarLiquidacion)

module.exports = router