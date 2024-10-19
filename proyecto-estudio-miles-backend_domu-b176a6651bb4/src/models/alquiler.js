const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); 

const Alquiler = sequelize.define('Alquiler', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    numero_carpeta: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Estado',
            key: 'id'
        }
    },
    id_inmueble: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Inmueble',
            key: 'id'
        }
    },
    dni_inquilino: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Persona',
            key: 'dni'
        }
    },
    fecha_registro: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_inicio_contrato: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_fin_contrato: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    precio_inicial: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    id_moneda: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Moneda',
            key: 'id'
        }
    },
    periodo_actualizacion: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    indice_actualizacion: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    porcentaje_actualizacion: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    id_forma_de_pago: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'forma_de_pago',
            key: 'id'
        }
    },
    dia_vencimiento_inquilino: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    dia_vencimiento_propietario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    porcentaje_mora_diaria: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    dia_inicial_mora: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    dni_propietario_principal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Persona',
            key: 'dni'
        }
    },
    observacion: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    fecha_cancelacion_contrato: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    permite_venta: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
},
{
    tableName: 'Alquiler',
    timestamps: false // Si no necesitas timestamps createdAt y updatedAt
})

module.exports = Alquiler;