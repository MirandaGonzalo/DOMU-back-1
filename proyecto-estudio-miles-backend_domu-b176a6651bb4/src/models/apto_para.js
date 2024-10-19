const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const Apto_Para = sequelize.define('Apto_Para',{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(60),
        allowNull: false
    }
}, {
    tableName: 'apto_para',
    timestamps: false 
});

module.exports = Apto_Para;
