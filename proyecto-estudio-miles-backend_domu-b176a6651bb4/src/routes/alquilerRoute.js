const express = require('express')
const router = express.Router()
const gestor_alquileres = require('../controllers/alquilerController')

router.use(express.json())

router.get("/", gestor_alquileres.getAlquileres)
router.get("/inquilinos", gestor_alquileres.obtenerInquilinos)
router.get('/propietarios', gestor_alquileres.obtenerPropietarios)
router.get("/:id", gestor_alquileres.obtenerDetalleAlquiler)
router.put("/", gestor_alquileres.modificarAlquiler)
router.post("/", gestor_alquileres.registrarAlquiler)
router.put("/cancelar", gestor_alquileres.cancelarAlquiler)
router.get("/datos/:id", gestor_alquileres.obtenerDatosAlquiler)
router.get("/alquileres/:dni_inquilino", gestor_alquileres.obtenerAlquileresDelInquilino)

module.exports = router