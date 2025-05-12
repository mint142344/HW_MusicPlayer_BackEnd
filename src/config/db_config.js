// File: src/config/db_config.js
const mysql = require('mysql2');
const dotenv = require('dotenv');

// 加载.env中的Key-Value 到 process.env
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

const promisePool = pool.promise();

module.exports = promisePool;