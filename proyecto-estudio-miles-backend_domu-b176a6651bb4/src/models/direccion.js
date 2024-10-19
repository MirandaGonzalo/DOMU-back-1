const { DataTypes } = require('sequelize');
const sequelize = require('../../config/connection'); // Ajusta la ruta según tu configuración de conexión

const Direccion = sequelize.define('Direccion', {
  id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
  },
  numero: {
      type: DataTypes.INTEGER,
      allowNull: false
  },
  calle: {
      type: DataTypes.STRING(60),
      allowNull: false
  },
  barrio: {
      type: DataTypes.STRING(60),
      allowNull: false
  },
  localidad: {
      type: DataTypes.STRING(60),
      allowNull: false
  },
  provincia: {
      type: DataTypes.STRING(60),
      allowNull: false
  },
  piso: {
      type: DataTypes.INTEGER,
      allowNull: true
  },
  departamento: {
      type: DataTypes.STRING(10),
      allowNull: true
  },
  codigo_postal: {
      type: DataTypes.STRING(10),
      allowNull: true
  }
}, {
  tableName: 'direccion',
  timestamps: false, // Si no necesitas timestamps createdAt y updatedAt
});

Direccion.prototype.obtenerDireccionCompleta = function() {
    return `${this.calle} ${this.numero}, ${this.barrio}`;
  };

module.exports = Direccion;