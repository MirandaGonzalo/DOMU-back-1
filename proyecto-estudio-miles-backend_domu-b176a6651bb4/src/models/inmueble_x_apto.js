const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const InmuebleXApto = sequelize.define('inmueble_x_apto', {
    id_inmueble: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Inmueble', // Ajusta al nombre del modelo de dirección si es necesario
            key: 'id'
        }
    },
    id_apto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: 'Apto_Para',
          key: 'id'
        }
      }
},
{
    tableName: 'inmueble_x_apto',
    timestamps: false // Si no necesitas timestamps createdAt y updatedAt
});
InmuebleXApto.removeAttribute('id');

module.exports = InmuebleXApto;