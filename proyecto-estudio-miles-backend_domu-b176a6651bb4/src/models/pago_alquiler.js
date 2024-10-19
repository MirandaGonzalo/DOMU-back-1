const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const PagoAlquiler = sequelize.define('pago_alquiler', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_alquiler: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Alquiler',
            key: 'id'
        }
    },
    id_estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Estado',
            key: 'id'
        }
    },
    mes_correspondiente: {
        type: DataTypes.STRING(7),
        allowNull: false
    },
    precio_alquiler: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    monto_mora: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    observacion: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
},
{
    tableName: 'pago_alquiler',
    timestamps: false
})

module.exports = PagoAlquiler;