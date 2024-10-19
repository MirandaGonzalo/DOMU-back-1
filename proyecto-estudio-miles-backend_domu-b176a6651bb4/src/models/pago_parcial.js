const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const PagoParcial = sequelize.define('pago_parcial', {
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
    id_forma_de_pago: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'forma_de_pago',
            key: 'id'
        }
    },
    monto: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    fecha_pago: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    paga_inquilino: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    observacion: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    monto_mora: {
        type: DataTypes.FLOAT,
        allowNull: true
    },

},
{
    tableName: 'pago_parcial',
    timestamps: false
})

module.exports = PagoParcial;