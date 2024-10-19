const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const GastoExtra = sequelize.define('gasto_extra', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_pago_alquiler: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pago_alquiler',
            key: 'id'
        }
    },
    descripcion: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    monto: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    quien_pago: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    a_quien_cobrar: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_pago_parcial: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'pago_parcial',
            key: 'id'
        }
    }
},
{
    tableName: 'gasto_extra',
    timestamps: false
})

module.exports = GastoExtra;