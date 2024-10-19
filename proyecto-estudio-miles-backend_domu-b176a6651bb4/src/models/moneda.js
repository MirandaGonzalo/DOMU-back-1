const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const Moneda = sequelize.define('Moneda', {
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
        allowNull: false
    }
}, {
    tableName: 'moneda',
    timestamps: false 
});

module.exports = Moneda;
