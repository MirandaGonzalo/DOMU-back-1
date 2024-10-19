const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const InmuebleXPersona = sequelize.define('inmueble_x_persona', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_inmueble: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Inmueble', // Ajusta al nombre del modelo de dirección si es necesario
            key: 'id'
        }
    },
    dni_persona: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Persona',
          key: 'dni'
        }
      }
},
{
    tableName: 'inmueble_x_persona',
    timestamps: false // Si no necesitas timestamps createdAt y updatedAt
});

module.exports = InmuebleXPersona;