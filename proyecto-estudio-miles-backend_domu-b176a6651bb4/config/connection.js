const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.MYSQLDB_DATABASE, process.env.MYSQLDB_USER, process.env.MYSQLDB_ROOT_PASSWORD, {
    host: process.env.MYSQLDB_ROOT_HOST,
    port: process.env.MYSQLDB_DOCKER_PORT,
    dialect: process.env.DB_DIALECT
});

module.exports = sequelize;