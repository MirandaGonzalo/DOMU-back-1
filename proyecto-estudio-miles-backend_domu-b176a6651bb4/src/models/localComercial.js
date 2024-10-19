const {DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const LocalComercial = sequelize.define('LocalComercial',{
    id_inmueble: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Inmueble',
            key: 'id'
        }
    },
    cortina_seguridad: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    vidriera: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    sala_de_estar: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    }
}, {
    tableName: 'local_comercial',
    timestamps: false 
});

module.exports = LocalComercial;
