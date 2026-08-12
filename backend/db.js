const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.HOST,
  port: Number(process.env.PORT),
  database: process.env.DATABASE,
  user: process.env.USER,
  password: process.env.PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("✅ Conectado ao PostgreSQL/Supabase!");
});

pool.on("error", (err) => {
  console.error("❌ Erro PostgreSQL:", err.message);
});

module.exports = pool;