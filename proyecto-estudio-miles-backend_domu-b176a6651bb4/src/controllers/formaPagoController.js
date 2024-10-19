const { Sequelize } = require('sequelize');
const sequelize = require('../../config/connection'); 
const { models } = require('../models/index');
const { Op } = require("sequelize");
const { FormaPagoSchema } = require('../validators/formaPagoValidator');
const { convertirVaciosAUndefined, verificarCambios, convertirUndefinedAVacios } = require('../utilities/functions');
const Alquiler = require('../models/alquiler');
const FormaDePago = models.FormaDePago;
const GastoFijo = models.GastoFijo;

const obtenerFormasPago = async (req, res) =>{
    try {
        await sequelize.authenticate();

        const formasPago = await FormaDePago.findAll({});

        return res.json(formasPago);

    } catch (error) {        
        return res.status(500).json({ errors: 'Error al obtener las formas de pago.' });
    }
};

const registrarFormaPago = async (req, res) =>{
    await sequelize.authenticate();
    const t = await sequelize.transaction();
     try {
        // Convertir campos vacíos a undefined
        convertirVaciosAUndefined(req.body);
        // Extraer datos de servicio del cuerpo de la solicitud
        let { nombre, descripcion } = req.body;
        // Junto los datos de persona
        const formaP = { nombre, descripcion };
        // Validar los datos recibidos usando Joi
        const { error: formaPagoError, value: formaPagoValue } = await FormaPagoSchema.validate(formaP, { abortEarly: false });
        if (formaPagoError) {
            t.rollback();
            const errorMessage = formaPagoError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessage });
        }
        convertirUndefinedAVacios(formaPagoValue);
        formaPagoValue.nombre = formaPagoValue.nombre.trim();
        if (formaPagoValue.descripcion != null)
            formaPagoValue.descripcion = formaPagoValue.descripcion.trim();
        let formaPago_encontrado = await FormaDePago.findOne({
            where: {
                nombre: formaPagoValue.nombre
            }
        });

        if (formaPago_encontrado) {
            await t.rollback();
            return res.status(409).json({ errors: 'Ya existe una Forma de Pago con ese Nombre.' });
        } 
        await FormaDePago.create(formaPagoValue, { transaction: t });
        // Confirmar la transacción
        await t.commit();
        return res.status(201).json({ message: 'Registro de Forma de Pago exitoso.' });
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
        return res.status(500).json({ errors: 'Error al registrar la Forma de Pago.' });
    }
};

const modificarFormaPago = async (req, res) => {
    await sequelize.authenticate();
    const t = await sequelize.transaction(); // Iniciar una transacción
    // Convertir campos vacíos a undefined
    convertirVaciosAUndefined(req.body);
    // Extraer datos de servicio del cuerpo de la solicitud
    let { nombre, descripcion } = req.body;
    // Junto los datos de persona
    const formaP = { nombre, descripcion };
    let formaPagoModificar  = parseInt(req.body.id);// Obtener el ID desde los parámetros de la solicitud
    if (!formaPagoModificar){
        await t.rollback();
        return res.status(400).json({ errors: 'Error al modificar la forma de pago.' });
    }
    // Validar los datos recibidos usando Joi
    const { error: formaPagoError, value: formaPagoValue } = await FormaPagoSchema.validate(formaP, { abortEarly: false });
    if (formaPagoError) {
        t.rollback();
        const errorMessage = formaPagoError.details.map(detail => detail.message);
        return res.status(400).json({ errors: errorMessage });
    }
    convertirUndefinedAVacios(formaPagoValue);
    formaPagoValue.nombre = formaPagoValue.nombre.trim();
    try {
        // Buscar la persona por su DNI
        const formaPago = await FormaDePago.findByPk(formaPagoModificar, { transaction: t });
        // Si el servicio no existe, devolver un error 404
        if (!formaPago) {
            await t.rollback();
            return res.status(404).json({ errors: 'Servicio no encontrado.' });
        }
        // Verificar si hay cambios en los datos del servicio
        const nombreFormaPagoAnterior = formaPago.nombre;
        if (nombreFormaPagoAnterior == formaPagoValue.nombre){
            await t.rollback();
            return res.status(200).json({ message: 'No hay cambios para actualizar.' });
        };
        let formaPagoNombre = await FormaDePago.findOne({
            where: {
                nombre: formaPagoValue.nombre,
                id: {
                    [Op.not]: formaPago.id
                }
            }
        });
        if (formaPagoNombre) {
            await t.rollback();
            return res.status(409).json({ errors: 'Ya existe una Forma de Pago con ese Nombre.' });
        } 
        const formaPagoChanges = {
            nombre: formaPagoValue.nombre
        };
        await formaPago.update(formaPagoChanges, { transaction: t });
        // Confirmar la transacción
        await t.commit();
        res.status(200).json({ message: 'Actualización exitosa.' });
      } catch (error) {
          await t.rollback(); // Deshacer la transacción en caso de error
          return res.status(500).json({ errors: 'Error al modificar la Forma de Pago.' });
      }
};

const validarFormaPago = async (id) => {
    try {
        // Validar que el ID sea un número entero
        if (!Number.isInteger(Number(id))) {
            return { valid: false, message: 'El id de Forma de Pago debe ser un número entero.' };
        }
        const formaSel = await FormaDePago.findByPk(id);
        if (!formaSel) {
            return { valid: false, message: 'La Forma de Pago seleccionada no existe.' };
        }
        return { valid: true };
    } catch (err) {
        return { valid: false, message: 'Error al validar la Forma de Pago' };
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

const eliminarFormaPago = async (req, res) => {
    await sequelize.authenticate();
    const t = await sequelize.transaction(); // Iniciar una transacción
    let formaPagoEliminar  = parseInt(req.body.id);// Obtener el ID desde los parámetros de la solicitud
    if (!Number.isInteger(Number(formaPagoEliminar))) {
        return res.status(400).json({ errors: 'El ID debe ser un número entero válido.' });
    }
    try 
    {
        // Buscar el servicio por su ID
        const formaPago = await FormaDePago.findByPk(formaPagoEliminar, { transaction: t });
        // Si el servicio no existe, devolver un error 404
        if (!formaPago) {
            await t.rollback();
            return res.status(404).json({ errors: 'Forma de Pago no encontrada.' });
        }
        const pagoAlquiler = await Alquiler.findAll({
            where:{
                id_forma_de_pago: formaPago.id
            }
        });
        if (pagoAlquiler.length > 0){
            await t.rollback();
            return res.status(404).json({ errors: 'No es posible eliminar una Forma de Pago asignada a un Alquiler.' });
        }
        const realizaronPagos = pagosRealizados(formaPago);
        if (realizaronPagos == false){
            await t.rollback();
            return res.status(404).json({ errors: 'No es posible eliminar una Forma de Pago asignada a un Pago.' });
        }
        await formaPago.destroy({ transaction: t });
        // Confirmar la transacción
        await t.commit();
        res.status(200).json({ message: 'Forma Pago eliminado.' });
      } catch (error) {
          await t.rollback(); // Deshacer la transacción en caso de error
          return res.status(500).json({ errors: 'Error al eliminar la Forma Pago.' });
      }
};

module.exports = { 
    obtenerFormasPago,
    registrarFormaPago,
    modificarFormaPago,
    validarFormaPago,
    eliminarFormaPago
}