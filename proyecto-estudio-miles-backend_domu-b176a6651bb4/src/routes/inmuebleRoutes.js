const express = require('express')
const router = express.Router()
const gestor_inmuebles = require('../controllers/inmuebleController')
const auth = require('../middlewares/autenticacion')

router.use(express.json())
//router.use(auth)
router.post("/", gestor_inmuebles.registrarInmueble)
router.get("/", gestor_inmuebles.getInmuebles)
router.get("/alquiler-simple", gestor_inmuebles.getInmueblesDisponibleAlquiler)
router.get("/venta-simple", gestor_inmuebles.getInmueblesDisponibleVenta)
router.put("/actualizar-estado", gestor_inmuebles.modificarEstadoInmueble)
router.put("/", gestor_inmuebles.modificarInmueble)
router.get("/:id", gestor_inmuebles.obtenerDetalleInmueble)
router.get("/tipo/:tipo", gestor_inmuebles.obtenerInmueblesPorTipo)


module.exports = router