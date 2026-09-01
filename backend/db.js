const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
connectionString: process.env.DATABASE_URL,
ssl: {
rejectUnauthorized: false
},
connectionTimeoutMillis: 15000,
idleTimeoutMillis: 30000,
max: 5
});

pool.on("error", (err) => {
console.error("Erro na conexão com o banco:", err.message);
});

module.exports = pool;
