const { Sequelize, Op } = require('sequelize');
const sequelize = require('../../config/connection'); 
const { models } = require('../models/index');
const { convertirVaciosAUndefined, convertirUndefinedAVacios } = require('../utilities/functions');
const { MonedaSchema } = require('../validators/monedaValidator');
const Alquiler = require('../models/alquiler');

const Moneda = models.Moneda;

const getMonedas = async (req, res) => {
    try {
        // Verifica el estado de la conexión antes de proceder
        await sequelize.authenticate();

        const monedas = await Moneda.findAll();

        const resultado = monedas.map(moneda => {

            const JSONmoneda = moneda.toJSON();
            JSONmoneda.nombre_concatenado = `${moneda.nombre} - ${moneda.descripcion}`
            return JSONmoneda
        })

        return res.json(resultado);

    } catch (error) {
        console.error('Error al obtener las monedas:', error);
        // Manejo del error y envío de una respuesta de error al cliente
        return res.status(500).json({ error: 'Error al obtener las monedas.' });
    }
};

const registrarMoneda = async (req, res) =>{

    try {
        await sequelize.authenticate();

        // Convertir campos vacíos a undefined
        convertirVaciosAUndefined(req.body);

        // Extraer datos de servicio del cuerpo de la solicitud
        const moneda = construirMoneda(req.body);

        // Validar los datos recibidos usando Joi
        const { error: monedaError, value: monedaValue } = MonedaSchema.validate(moneda, { abortEarly: false });
        
        if (monedaError) {
            const errorMessage = monedaError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessage });
        }

        convertirUndefinedAVacios(monedaValue);
        monedaValue.nombre = monedaValue.nombre.trim();
        if (monedaValue.descripcion != null)
            monedaValue.descripcion = monedaValue.descripcion.trim();
        
        let moneda_encontrada = await Moneda.findOne({
            where: {
                nombre: monedaValue.nombre
            }
        });

        if (moneda_encontrada) {
            return res.status(409).json({ errors: 'Ya existe una Moneda con ese Nombre.' });
        } 

        await Moneda.create(monedaValue);

        return res.status(201).json({ message: 'Registro de Moneda exitoso.' });

    } catch (error) {
        if (error.isJoi) {
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessages });
        }
        return res.status(500).json({ errors: 'Error al registrar la Moneda.' });
    }
};

const modificarMoneda = async (req, res) => {
    try {

        await sequelize.authenticate();

        // Convertir campos vacíos a undefined
        convertirVaciosAUndefined(req.body);

        // Extraer datos de servicio del cuerpo de la solicitud
        const moneda = construirMoneda(req.body);

        let idMonedaAModificar  = parseInt(req.body.id);
        if (!idMonedaAModificar){
            return res.status(400).json({ errors: 'El id de moneda debe ser un número.' });
        }

        // Validar los datos recibidos usando Joi
        const { error: monedaError, value: monedaValue } = MonedaSchema.validate(moneda, { abortEarly: false });
        if (monedaError) {
            const errorMessage = monedaError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessage });
        }

        convertirUndefinedAVacios(monedaValue);
        monedaValue.nombre = monedaValue.nombre.trim();
        if (monedaValue.descripcion != null)
            monedaValue.descripcion = monedaValue.descripcion.trim();

        // Buscar la persona por su DNI
        const monedaAnterior = await Moneda.findByPk(idMonedaAModificar);
        // Si el servicio no existe, devolver un error 404
        if (!monedaAnterior) {
            return res.status(404).json({ errors: 'Moneda no encontrada.' });
        }

        // Verificar si hay cambios en los datos de la moneda
        const nombreMonedaAnterior = monedaAnterior.nombre;
        const descripcionMonedaAnterior = monedaAnterior.descripcion;
        if (nombreMonedaAnterior == monedaValue.nombre && descripcionMonedaAnterior == monedaValue.descripcion){
            return res.status(200).json({ message: 'No hay cambios para actualizar.' });
        };

        let monedaNombre = await Moneda.findOne({
            where: {
                nombre: monedaValue.nombre,
                id: {
                    [Op.not]: monedaAnterior.id
                }
            }
        });
        if (monedaNombre) {
            return res.status(409).json({ errors: 'Ya existe una Moneda con ese Nombre.' });
        }

        const monedaChanges = {
            nombre: monedaValue.nombre,
            descripcion: monedaValue.descripcion
        };
        await monedaAnterior.update(monedaChanges);

        res.status(200).json({ message: 'Actualización exitosa.' });

        }catch (error) {
            return res.status(500).json({ errors: 'Error al modificar la Moneda.' });
        }
};

const eliminarMoneda = async (req, res) => {
    try 
    {
        await sequelize.authenticate();
        let monedaEliminar  = parseInt(req.body.id);
        if (!Number.isInteger(Number(monedaEliminar))) {
            return res.status(400).json({ errors: 'El ID debe ser un número entero válido.' });
        }

        const moneda = await Moneda.findByPk(monedaEliminar);

        if (!moneda) {
            return res.status(404).json({ errors: 'Moneda no encontrada.' });
        }

        const pagoAlquiler = await Alquiler.findAll({
            where:{
                id_moneda: moneda.id
            }
        });
        if (pagoAlquiler.length > 0){
            return res.status(404).json({ errors: 'No es posible eliminar una Moneda asignada a un Alquiler.' });
        }

        const realizaronPagos = pagosRealizados(moneda);
        if (realizaronPagos == false){
            return res.status(404).json({ errors: 'No es posible eliminar una Moneda asignada a un Pago.' });
        }

        await moneda.destroy();

        res.status(200).json({ message: 'Moneda eliminada.' });
    } catch (error) {
        return res.status(500).json({ errors: 'Error al eliminar la Moneda.' });
    }
};

const pagosRealizados = async (formaPago) =>{
    try {
        /*
        await sequelize.authenticate();
        const estados = await Estado.findAll({
            attributes: ['id'],
            where:{
                nombre: { [Op.in]: validos } 
            }
        });
        return estados;
        */
       return true;
  
    } catch (error) {        
        throw error;
    }
};

const construirMoneda = (data) => {
    let { nombre, descripcion } = data;
    return { nombre, descripcion };
}

const validarMoneda = async (id) => {
    try {
        // Validar que el ID sea un número entero
        if (!Number.isInteger(Number(id))) {
            return { valid: false, message: 'El id de Moneda debe ser un número entero.' };
        }
        const monedaSel = await Moneda.findByPk(id);
        if (!monedaSel) {
            return { valid: false, message: 'La Moneda seleccionada no existe.' };
        }
        return { valid: true };
    } catch (err) {
        return { valid: false, message: 'Error al validar la Moneda' };
    }
};

module.exports = { 
    getMonedas,
    validarMoneda,
    registrarMoneda,
    modificarMoneda,
    eliminarMoneda
}