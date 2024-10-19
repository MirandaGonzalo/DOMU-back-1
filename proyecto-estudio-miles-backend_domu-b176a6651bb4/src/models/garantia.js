const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const Garantia = sequelize.define('garantia', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_alquiler: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Alquiler',
            key: 'id'
        }
    },
    dni_responsable: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Persona',
            key: 'dni'
        }
    },
    tipo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    numero_escritura: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
}, {
    tableName: 'garantia',
    timestamps: false 
});

module.exports = Garantia;