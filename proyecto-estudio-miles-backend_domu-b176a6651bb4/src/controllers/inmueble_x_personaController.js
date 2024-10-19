const { Sequelize } = require('sequelize');
const sequelize = require('../../config/connection'); 
const { models } = require('../models/index');

const InmuebleXPersona = models.InmuebleXPersona;
const Inmueble = models.Inmueble;
const Persona = models.Persona;
const Direccion = models.Direccion;

const obtenerInmueblesXPersona = async (req, res) => {
    
    try {
        const inmuebles = await Inmueble.findAll({
            include: [
              {
                model: Persona,
                attributes: ['dni', 'nombre', 'celular', 'email'],
                through: { attributes: [] } // Ocultar la tabla intermedia en el resultado
              },
              {
                model: Direccion,
                as: 'direccion',
                attributes: ['numero', 'calle', 'barrio']
              }
            ]});

        res.status(200).json(inmuebles); 
        
    } catch (error) {
      console.error('Error al obtener los inmuebles / propietarios:', error);
      res.status(500).json({ error: 'Error al obtener los inmuebles / propietarios.' });
    }
};

module.exports = { 
    obtenerInmueblesXPersona
}