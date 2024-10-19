const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const Estado = sequelize.define('Estado', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(60),
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING(60),
        allowNull: false
    }
},
{
    tableName: 'estado',
    timestamps: false // Si no necesitas timestamps createdAt y updatedAt
});

module.exports = Estado;