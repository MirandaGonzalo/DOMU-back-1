const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const FormaDePago = sequelize.define('forma_de_pago', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
}, {
    tableName: 'forma_de_pago',
    timestamps: false 
});

module.exports = FormaDePago;