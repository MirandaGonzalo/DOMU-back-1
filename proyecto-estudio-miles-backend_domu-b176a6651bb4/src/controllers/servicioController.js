const { Sequelize } = require('sequelize');
const sequelize = require('../../config/connection'); 
const { models } = require('../models/index');
const { ServicioSchema } = require('../validators/servicioValidator');
const { convertirVaciosAUndefined } = require('../utilities/functions');
const Servicio = models.Servicio;
const DetalleServicio = models.DetalleServicio;

const getServicios = async (req, res) => {
    try {
        // Verifica el estado de la conexión antes de proceder
        await sequelize.authenticate();

        const servicio = await Servicio.findAll({
            order: [
                ['nombre', 'ASC']
            ]
        });

        return res.json(servicio);
    } catch (error) {
        console.error('Error al obtener los servicios:', error);
        // Manejo del error y envío de una respuesta de error al cliente
        return res.status(500).json({ errors: 'Error al obtener los servicios.' });
    }
};

const registrarServicio = async (req, res) => {

    await sequelize.authenticate();

    const t = await sequelize.transaction();

     try {
        // Convertir campos vacíos a undefined
        convertirVaciosAUndefined(req.body);

        // Extraer datos de servicio del cuerpo de la solicitud
        let { nombre } = req.body;

        nombre = nombre.trim();
        // Junto los datos de persona
        const servicio = { nombre };
        
        // Validar los datos recibidos usando Joi
        const { error: servicioError, value: servicioValue } = await ServicioSchema.validate(servicio, { abortEarly: false });

        if (servicioError) {
            t.rollback();
            const errorMessage = servicioError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessage });
        }

        let servicio_encontrado = await Servicio.findOne({
            where: {
                nombre: nombre
            }
        });

        if (servicio_encontrado) {
            await t.rollback();
            return res.status(409).json({ errors: 'Ya existe un servicio con ese Nombre.' });
        } 
        
        await Servicio.create(servicio, { transaction: t });

        // Confirmar la transacción
        await t.commit();

        return res.status(201).json({ message: 'Registro de Servicio exitoso.' });
        
        
    } catch (error) {

        if (error.isJoi) {
            await t.rollback();
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessages });
        }

        if (t)
        {
            await t.rollback();
        }
        
        return res.status(500).json({ errors: 'Error al registrar el servicio.' });
    }
};

const modificarServicio = async (req, res) => {

    await sequelize.authenticate();
    const t = await sequelize.transaction(); // Iniciar una transacción

    // Convertir campos vacíos a undefined
    convertirVaciosAUndefined(req.body);

    // Extraer datos des servicio del cuerpo de la solicitud
    let { nombre } = req.body;
    nombre = nombre.trim();
    // Junto el dato de servicio
    const servicioData = { nombre };
    // Validar los datos recibidos usando Joi
    const { error: servicioError, value: servicioValue } = ServicioSchema.validate(servicioData, { abortEarly: false });

    if (servicioError) {
        await t.rollback();
        const errorMessages = servicioError.details.map(detail => detail.message);
        return res.status(400).json({ errors: errorMessages });
    };
    let servicioModificar  = parseInt(req.body.id);// Obtener el ID desde los parámetros de la solicitud

    try {
        // Buscar la persona por su DNI
        const servicio = await Servicio.findByPk(servicioModificar, { transaction: t });
        // Si el servicio no existe, devolver un error 404
        if (!servicio) {
            await t.rollback();
            return res.status(404).json({ errors: 'Servicio no encontrado.' });
        }
        // Verificar si hay cambios en los datos del servicio
        const nombreServicioAnterior = servicio.nombre;
        if (nombreServicioAnterior == servicioValue.nombre){
            await t.rollback();
            return res.status(200).json({ message: 'No hay cambios para actualizar.' });
        };

        let servicio_encontrado = await Servicio.findOne({
            where: {
                nombre: servicioValue.nombre
            }
        });

        if (servicio_encontrado) {
            await t.rollback();
            return res.status(409).json({ errors: 'Ya existe un servicio con ese Nombre.' });
        } 
        
        const servicioChanges = {
            nombre: servicioValue.nombre
        };

        await servicio.update(servicioChanges, { transaction: t });

        // Confirmar la transacción
        await t.commit();

        res.status(200).json({ message: 'Actualización exitosa.' });

      } catch (error) {
          await t.rollback(); // Deshacer la transacción en caso de error
          return res.status(500).json({ errors: 'Error al modificar el servicio.' });
      }
};

const eliminarServicio = async (req, res) => {

    await sequelize.authenticate();
    const t = await sequelize.transaction(); // Iniciar una transacción

    let servicioModificar  = parseInt(req.body.id);// Obtener el ID desde los parámetros de la solicitud

    if (!Number.isInteger(Number(servicioModificar))) {
        return res.status(400).json({ errors: 'El ID debe ser un número entero válido.' });
    }

    try {

        // Buscar el servicio por su ID
        const servicio = await Servicio.findByPk(servicioModificar, { transaction: t });
  
        // Si el servicio no existe, devolver un error 404
        if (!servicio) {
            await t.rollback();
            return res.status(404).json({ errors: 'Servicio no encontrado.' });
        }
  
        const serviciosXInmueble = await DetalleServicio.findAll({
            where:{
                id_servicio: servicio.id
            }
        });
        
        if (serviciosXInmueble.length > 0){
            await t.rollback();
            return res.status(404).json({ errors: 'No es posible eliminar un Servicio asignado a un Inmueble.' });
        }

        await servicio.destroy({ transaction: t });

        // Confirmar la transacción
        await t.commit();

        res.status(200).json({ message: 'Servicio eliminado.' });

      } catch (error) {
          await t.rollback(); // Deshacer la transacción en caso de error
          return res.status(500).json({ errors: 'Error al eliminar el servicio.' });
      }
};

module.exports = { 
    getServicios,
    registrarServicio,
    modificarServicio,
    eliminarServicio
}