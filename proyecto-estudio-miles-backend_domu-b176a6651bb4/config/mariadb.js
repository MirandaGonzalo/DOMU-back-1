const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
    host: process.env.MYSQLDB_ROOT_HOST,
    user: process.env.MYSQLDB_USER,
    database: process.env.MYSQLDB_DATABASE,
    password: process.env.MYSQLDB_ROOT_PASSWORD,
    port: process.env.MYSQLDB_DOCKER_PORT,
    dialect: process.env.DB_DIALECT
}