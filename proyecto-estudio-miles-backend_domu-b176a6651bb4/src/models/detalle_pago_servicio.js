const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const DetallePagoServicio = sequelize.define('detalle_pago_servicio', {
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
    id_alquiler: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'gasto_fijo',
            key: 'id_alquiler'
        }
    },
    id_servicio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'gasto_fijo',
            key: 'id_servicio'
        }
    },
    monto: {
        type: DataTypes.FLOAT,
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
    tableName: 'detalle_pago_servicio',
    timestamps: false
})

module.exports = DetallePagoServicio;