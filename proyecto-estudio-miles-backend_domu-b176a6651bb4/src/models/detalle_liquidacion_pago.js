const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const DetalleLiquidacionPago = sequelize.define('detalle_liquidacion_pago', {
    id_pago_alquiler: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'pago_alquiler',
            key: 'id'
        }
    },
    id_liquidacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'liquidacion_propietario',
            key: 'id'
        }
    }
},
{
    tableName: 'detalle_liquidacion_pago',
    timestamps: false
})

module.exports = DetalleLiquidacionPago;