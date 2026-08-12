const { Pool } = require("pg");
const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

console.log("HOST:", process.env.DB_HOST);
console.log("PORT:", process.env.DB_PORT);
console.log("DATABASE:", process.env.DB_NAME);
console.log("USER:", process.env.DB_USER);
console.log("PASSWORD:", process.env.DB_PASSWORD ? "OK" : "ERRO");

const pool = new Pool({
    host: process.env.DB_HOST,
    port: 6543,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: true,
    connectionTimeoutMillis: 30000
});

module.exports = pool;