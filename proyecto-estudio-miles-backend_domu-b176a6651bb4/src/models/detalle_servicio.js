const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const DetalleServicio = sequelize.define('detalle_servicio', {
    id_inmueble: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Inmueble', 
            key: 'id'
        },
        allowNull: false
    },
    id_servicio: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Servicio',
            key: 'id'
        },
        allowNull: false
    }
},
{
    tableName: 'detalle_servicio',
    timestamps: false // Si no necesitas timestamps createdAt y updatedAt
})

module.exports = DetalleServicio;