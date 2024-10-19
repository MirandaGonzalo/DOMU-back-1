const express = require('express')
const router = express.Router()
const gestor_personas = require('../controllers/personaController')

router.use(express.json())

router.post("/", gestor_personas.registrarPersona)
router.get("/activas-simple", gestor_personas.getPersonasActivasSimple)
router.get("/:dni", gestor_personas.obtenerPersona)
router.get("/", gestor_personas.getPersonas)
router.get('/:dni/detalle', gestor_personas.obtenerDetallePersona);
router.put("/", gestor_personas.modificarPersona)
router.put("/actualizar-estado", gestor_personas.modificarEstadoPersona)
router.get("/personas-no-propietarias/:id_inmueble", gestor_personas.obtenerPersonasNoPropietarias)

module.exports = router