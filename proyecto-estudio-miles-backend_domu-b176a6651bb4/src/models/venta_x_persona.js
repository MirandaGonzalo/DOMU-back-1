const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const VentaXPersona = sequelize.define('venta_x_persona', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_venta: {
        type: DataTypes.INTEGER,
        references: {
            model: 'venta',
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
    },
    es_comprador: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
},
{
    tableName: 'venta_x_persona',
    timestamps: false // Si no necesitas timestamps createdAt y updatedAt
});

module.exports = VentaXPersona;