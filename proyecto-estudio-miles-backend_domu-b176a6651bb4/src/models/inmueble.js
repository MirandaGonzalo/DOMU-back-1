const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const Inmueble = sequelize.define('Inmueble', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    codigo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_direccion: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Direccion', // Ajusta al nombre del modelo de dirección si es necesario
            key: 'id'
        }
    },
    id_estado: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Estado', // Ajusta al nombre del modelo de estado si es necesario
            key: 'id'
        }
    },
    id_estado_anterior: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Estado', // Ajusta al nombre del modelo de estado si es necesario
            key: 'id'
        }
    },
    fecha_ingreso: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_baja: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    descripcion: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    cantidad_baños: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    alarma: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    deposito: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    cloacas: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    cocina: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    capacidad_estacionamiento: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    calefaccion: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    sistema_frio: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    ambientes: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    total_superficie: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    frente_terreno: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    largo_terreno: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    superficie_edificada: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    superficie_descubierta: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    plantas: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    expensas: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    nombre_complejo: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    año_estreno: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    portero: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    escritura: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    parrilla: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
},
{
    tableName: 'Inmueble',
    timestamps: false // Si no necesitas timestamps createdAt y updatedAt
});

module.exports = Inmueble;