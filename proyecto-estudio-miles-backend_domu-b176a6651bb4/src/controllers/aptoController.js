const mariadb = require('mariadb')
const config = require("../../config/mariadb")
const { Sequelize } = require('sequelize');
const sequelize = require('../../config/connection'); 
const { models } = require('../models/index');

const Apto = models.AptoPara;

const obtenerAptos = async (req, res) => {
    try {
      const aptos = await Apto.findAll();
      res.status(200).json(aptos);
    } catch (error) {
      console.error('Error al obtener los aptos:', error);
      res.status(500).json({ error: 'Error al obtener los aptos.' });
    }
};

module.exports = {
    obtenerAptos
}