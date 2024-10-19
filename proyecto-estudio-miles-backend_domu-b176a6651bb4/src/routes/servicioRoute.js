const express = require('express')
const router = express.Router()
const gestor_servicios = require('../controllers/servicioController')

router.use(express.json())

router.post("/", gestor_servicios.registrarServicio)
router.get("/", gestor_servicios.getServicios)
router.put("/", gestor_servicios.modificarServicio)
router.delete("/", gestor_servicios.eliminarServicio)

module.exports = router