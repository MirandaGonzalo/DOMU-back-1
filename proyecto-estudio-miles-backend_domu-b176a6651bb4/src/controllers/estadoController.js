const { Sequelize, Op } = require('sequelize');
const sequelize = require('../../config/connection'); 
const { models } = require('../models/index');

const Estado = models.Estado;

const obtenerEstadosPorTipo = async (req, res) => {
    
    const { tipo } = req.params;

    try {
        const estados = await Estado.findAll({
        where: {
            tipo: tipo
        }
        });

        if (estados.length === 0) {
            return res.status(404).json({ message: 'No se encontraron estados para el tipo especificado' });
        }

        res.status(200).json(estados); 
        
    } catch (error) {
      console.error('Error al obtener los estados:', error);
      res.status(500).json({ error: 'Error al obtener los estados.' });
    }
};

// Función para buscar o crear un estado activo y general
const buscarOCrearEstadoPorParametro = async (nombre, tipo) => {
  try {
      // Buscar el estado activo y general en la base de datos
      let estado = await Estado.findOne({ 
        where: { nombre: nombre, tipo: tipo } 
      });

      // Si no existe, crearlo
      if (!estado) {
        estado = await Estado.create({ nombre: nombre, tipo: tipo });
      };
      return estado; // Devuelve el estado encontrado o creado
  } catch (error) {
      throw error; // Lanza cualquier error al llamante
  }
};

const obtenerIdEstadoPorParametro = async (nombre, tipo) => {
  try 
  {
    // Llamar a la función para buscar o crear el estado
    const estado = await buscarOCrearEstadoPorParametro(nombre, tipo);
    
    // Obtener el ID del estado encontrado o creado
    const estadoId = estado.id;
    if (!estadoId)
      return -1;

    return estadoId;
  
  } catch (error) {
    throw error; // O manejar el error según tu lógica de aplicación
  }
};

// Función para buscar o crear un estado activo y general
const buscarOCrearEstadoActivoGeneral = async () => {
  try {
    // Buscar el estado activo y general en la base de datos
    let estado = await Estado.findOne({ 
      where: { nombre: 'Activo', tipo: 'General' } 
    });

    // Si no existe, crearlo
    if (!estado) {
      estado = await Estado.create({ nombre: 'Activo', tipo: 'General' });
    }

    return estado; // Devuelve el estado encontrado o creado
  } catch (error) {
    throw error; // Lanza cualquier error al llamante
  }
};

const obtenerIdEstadoActivoGeneral = async () => {
  try 
  {
    // Llamar a la función para buscar o crear el estado
    const estado = await buscarOCrearEstadoActivoGeneral();
    
    // Obtener el ID del estado encontrado o creado
    const estadoId = estado.id;
    
    console.log('ID del estado activo y general:', estadoId);
    
    return estadoId;
  } catch (error) {
    console.error('Error al obtener ID del estado activo y general:', error);
    throw error; // O manejar el error según tu lógica de aplicación
  }
};

// Función para buscar o crear un estado inactivo y general
const buscarOCrearEstadoInactivoGeneral = async () => {
  try {
    // Buscar el estado activo y general en la base de datos
    let estado = await Estado.findOne({ 
      where: { nombre: 'Inactivo', tipo: 'General' } 
    });

    // Si no existe, crearlo
    if (!estado) {
      estado = await Estado.create({ nombre: 'Inactivo', tipo: 'General' });
    }

    return estado; // Devuelve el estado encontrado o creado
  } catch (error) {
    throw error; // Lanza cualquier error al llamante
  }
};

const obtenerIdEstadoInactivoGeneral = async () => {
  try 
  {
    // Llamar a la función para buscar o crear el estado
    const estado = await buscarOCrearEstadoInactivoGeneral();
    
    // Obtener el ID del estado encontrado o creado
    const estadoId = estado.id;
    
    console.log('ID del estado inactivo y general:', estadoId);
    
    return estadoId;
  } catch (error) {
    console.error('Error al obtener ID del estado inactivo y general:', error);
    throw error; // O manejar el error según tu lógica de aplicación
  }
};

const validarEstado = async (id, validos) => {
  try {
      // Validar que el ID sea un número entero
      if (!Number.isInteger(Number(id))) {
          return { valid: false, message: 'El id de Estado debe ser un número entero.' };
      }
      const estadoSel = await Estado.findByPk(id);
      if (!estadoSel) {
          return { valid: false, message: 'El Estado seleccionado no existe.' };
      }
      const estadosValidos = await obtenerEstadosValidos(validos);
      let estadoValido = false;
      estadosValidos.forEach(estado => {
          if (estado.id == estadoSel.id)
              estadoValido = true;
      });
      if(!estadoValido){
          return { valid: false, message: 'El Estado seleccionado no es valido.' };
      }
      return { valid: true };
  } catch (err) {
      return { valid: false, message: 'Error al validar el Estado' };
  }
};

const obtenerEstadosValidos= async (validos) =>{
  try {
      await sequelize.authenticate();
      const estados = await Estado.findAll({
          attributes: ['id'],
          where:{
              nombre: { [Op.in]: validos } 
          }
      });

      return estados;

  } catch (error) {        
      throw error;
  }
};

module.exports = { 
    obtenerEstadosPorTipo,
    obtenerIdEstadoActivoGeneral ,
    obtenerIdEstadoInactivoGeneral,
    obtenerIdEstadoPorParametro,
    validarEstado
}