<<<<<<< HEAD
require("dotenv").config();

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    throw new Error("Configure DATABASE_URL nas variaveis de ambiente.");
}

const databaseUrl = new URL(process.env.DATABASE_URL);

if (!databaseUrl.searchParams.has("sslmode")) {
    databaseUrl.searchParams.set("sslmode", "require");
}

const pool = new Pool({
    connectionString: databaseUrl.toString(),
    ssl: {
        rejectUnauthorized: false
    }
=======
﻿const { Pool } = require("pg");
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
>>>>>>> 38204cfa6cff29ea79e3381ab5f24473d5e265df
});

module.exports = pool;
