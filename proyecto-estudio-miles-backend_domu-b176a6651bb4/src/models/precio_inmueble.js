const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const PrecioInmueble = sequelize.define('PrecioInmueble',{
    id_inmueble: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Inmueble',
            key: 'id'
        }
    },
    tipo_precio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    monto: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    id_moneda: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Moneda',
            key: 'id'
        }
    },
}, {
    tableName: 'precio_inmueble',
    timestamps: false 
});

module.exports = PrecioInmueble;