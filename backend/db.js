require("dotenv").config();

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    throw new Error("Configure DATABASE_URL nas variaveis de ambiente.");
}

const databaseUrl = new URL(process.env.DATABASE_URL);

if (!databaseUrl.searchParams.has("sslmode")) {
    databaseUrl.searchParams.set("sslmode", "require");
}

if (!databaseUrl.searchParams.has("uselibpqcompat")) {
    databaseUrl.searchParams.set("uselibpqcompat", "true");
}

const pool = new Pool({
    connectionString: databaseUrl.toString(),
    ssl: true,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
});

pool.on("error", (error) => {
    console.error("Erro inesperado no PostgreSQL:", error.message);
});

module.exports = pool;
