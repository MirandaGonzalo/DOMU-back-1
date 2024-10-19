const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 


const Departamento = sequelize.define('Departamento',{
    id_vivienda: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Vivienda',
            key: 'id_inmueble'
        }
    },
    summ: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    ascensor: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    patio_en_comun: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    cantidad_pisos_edificio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    gimnasio: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    solarium: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    }
}, {
    tableName: 'departamento',
    timestamps: false 
});


module.exports = Departamento;
