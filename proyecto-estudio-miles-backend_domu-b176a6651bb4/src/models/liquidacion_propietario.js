const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const LiquidacionPropietario = sequelize.define('liquidacion_propietario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fecha_liquidacion: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    porcentaje_comision: {
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
    id_forma_de_pago: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'forma_de_pago',
            key: 'id'
        }
    },
    observacion: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
},
{
    tableName: 'liquidacion_propietario',
    timestamps: false
})

module.exports = LiquidacionPropietario;