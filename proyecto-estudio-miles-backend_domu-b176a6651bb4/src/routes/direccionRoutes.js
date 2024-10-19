const express = require('express')
const router = express.Router()
const gestor_direcciones = require('../controllers/direccionController')

router.use(express.json())

router.post("/", gestor_direcciones.agregarDireccion)
router.get('/', gestor_direcciones.obtenerDirecciones);
router.get('/:id', gestor_direcciones.obtenerDireccionPorId);

module.exports = router