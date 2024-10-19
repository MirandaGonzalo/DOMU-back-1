const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const GastoFijo = sequelize.define('gasto_fijo', {
    id_alquiler: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Alquiler',
            key: 'id'
        }
    },
    id_servicio: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Servicio',
            key: 'id'
        }
    },
    tipo_pago: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    dia_vencimiento: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    numero_cliente: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    numero_contrato: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
},
{
    tableName: 'gasto_fijo',
    timestamps: false // Si no necesitas timestamps createdAt y updatedAt
})

module.exports = GastoFijo;