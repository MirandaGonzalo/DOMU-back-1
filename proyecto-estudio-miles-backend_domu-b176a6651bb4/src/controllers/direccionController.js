const mariadb = require('mariadb')
const config = require("../../config/mariadb")
const { Sequelize } = require('sequelize');
const sequelize = require('../../config/connection'); 
const { direccionSchema } = require('../validators/direccionValidator');
const { models } = require('../models/index');

const Direccion = models.Direccion;

const agregarDireccion = async (req, res) => {
    // Validar los datos recibidos usando Joi
    const { error, value } = direccionSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({ errors: errorMessages });
    }

    const t = await sequelize.transaction();
    
    try {
      
        await sequelize.authenticate();
        // Crear nueva dirección en la base de datos
        const direccion = await Direccion.create(value, { transaction: t });
        // Confirmar la transacción
        await t.commit();
        res.status(201).json(direccion);

    } catch (error) {
        // Revertir la transacción en caso de error
        await t.rollback();
        console.error('Error al registrar la dirección:', error);
        res.status(500).json({ error: 'Error al registrar la dirección.' });
    }
};
  
const obtenerDirecciones = async (req, res) => {
    try {
      const direcciones = await Direccion.findAll();
      res.status(200).json(direcciones);
    } catch (error) {
      console.error('Error al obtener las direcciones:', error);
      res.status(500).json({ error: 'Error al obtener las direcciones.' });
    }
};

const obtenerDireccionPorId = async (req, res) => {
    const { id } = req.params;
  
    // Validar que el ID sea un número entero
    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({ error: 'El ID de la Direccón debe ser un número entero válido.' });
    }

    try {
      const direccion = await Direccion.findByPk(id);
  
      if (!direccion) {
        return res.status(404).json({ error: 'Dirección no encontrada.' });
      }
  
      res.status(200).json(direccion);
    } catch (error) {
        console.error('Error al obtener la dirección por ID:', error);
        res.status(500).json({ error: 'Error al obtener la dirección por ID' });
    }
  };

async function agregar(nueva, t){

    try {
        const direccion = await Direccion.create(nueva, { transaction: t });
        const id_direccion = direccion.id;
        return id_direccion;
    } catch (err) {
        console.error("Error registrando la direccion", err);
        throw err;
    }
}

module.exports = {
    obtenerDirecciones,
    obtenerDireccionPorId,
    agregarDireccion,
    agregar
};

