const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 


const Vivienda = sequelize.define('Vivienda',{
    id_inmueble: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Inmueble',
            key: 'id'
        }
    },
    cantidad_dormitorios: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cantidad_dormitorios_suites: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cantidad_toilette: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    living: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    balcon: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    pileta: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    lavadero: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    vestidor: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    mascotas: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    hall: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    }
}, {
    tableName: 'vivienda',
    timestamps: false 
});

module.exports = Vivienda;
