const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const Saldo = sequelize.define('saldo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_pago_parcial_origen: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pago_parcial',
            key: 'id'
        }
    },
    id_pago_parcial_cubierto: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'pago_parcial',
            key: 'id'
        }
    },
    descripcion: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    monto: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    quien_pago: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    }
},
{
    tableName: 'saldo',
    timestamps: false
})

module.exports = Saldo;