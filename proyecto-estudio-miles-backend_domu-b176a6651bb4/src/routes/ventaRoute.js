const express = require('express')
const router = express.Router()
const gestor_ventas = require('../controllers/ventaController')

router.use(express.json())

router.get("/", gestor_ventas.getVentas)
router.post("/", gestor_ventas.registrarReserva)
router.put("/cerrar/:id", gestor_ventas.cerrarVenta)
router.put("/", gestor_ventas.modificarVenta)
router.get("/:id", gestor_ventas.getDetalleVenta)
router.put("/cancelar-venta/:id", gestor_ventas.cancelarVenta)

module.exports = router