const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const Venta = sequelize.define('venta', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fecha_venta: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    id_inmueble: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Inmueble',
            key: 'id'
        }
    },
    dni_comprador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Persona',
            key: 'dni'
        },
        as: 'comprador'
    },
    monto_reserva: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    precio_venta: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    id_forma_de_pago: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'forma_de_pago',
            key: 'id'
        }
    },
    id_moneda: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Moneda',
            key: 'id'
        }
    },
    porcentaje_comision: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    fecha_cierre: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    id_estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Estado',
            key: 'id'
        }
    },
    observacion: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
},
{
    tableName: 'venta',
    timestamps: false // Si no necesitas timestamps createdAt y updatedAt
})

module.exports = Venta;