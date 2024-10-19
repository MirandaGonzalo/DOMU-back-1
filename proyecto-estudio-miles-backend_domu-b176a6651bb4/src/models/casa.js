const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const Casa = sequelize.define('Casa',{
    id_vivienda: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Vivienda',
            key: 'id_inmueble'
        }
    },
    galeria: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    patio_interno: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    jardin: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    patio: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    quincho: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    reja: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    }
}, {
    tableName: 'casa',
    timestamps: false 
});

module.exports = Casa;
