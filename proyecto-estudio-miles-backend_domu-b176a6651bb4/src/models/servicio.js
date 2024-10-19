//id INT AUTO_INCREMENT,
//nombre VARCHAR(60) NOT NULL

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const Servicio = sequelize.define('Servicio', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(60),
        allowNull: false
    }
},
{
    tableName: 'servicio',
    timestamps: false // Si no necesitas timestamps createdAt y updatedAt
})

module.exports = Servicio;