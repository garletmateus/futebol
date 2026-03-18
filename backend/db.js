const mysql = require("mysql2");

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root", // Sua senha
    database: "resenha_sports",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exporta permitindo usar await/async
module.exports = pool.promise();
