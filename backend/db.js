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
});

module.exports = pool;
