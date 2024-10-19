// persona.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); // Ajusta la ruta según tu configuración de conexión

const Persona = sequelize.define('Persona', {
    dni: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    cuit: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
          containsDni(value) {
            const dniStr = this.dni.toString();
            const cuitStr = value.toString();
            if (!cuitStr.includes(dniStr)) {
              throw new Error('El CUIT debe contener el DNI de la persona.');
            }
          }
        }
    },
    celular: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    celular_secundario: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    cuenta_banco: {
        type: DataTypes.STRING(22),
        allowNull: true
    },
    condicion_iva: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    observacion: {
        type: DataTypes.STRING(100),
        allowNull: true
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
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true, // Asegura que el email sea único en la tabla
        validate: {
          isEmail: true, // Validación de formato de email
        },
    },
    ocupacion: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
}, {
    tableName: 'persona',
    timestamps: false // Si no necesitas timestamps createdAt y updatedAt
});

module.exports = Persona;
