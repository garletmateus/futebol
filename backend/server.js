const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const produtosRouter = require("./routes/produtos");
const pedidosRouter = require("./routes/pedidos");
const pagamentosRouter = require("./routes/pagamentos");
const { ensureSchema } = require("./ensureSchema");

const app = express();

const PORT = process.env.SERVER_PORT || 3000;

const frontendDir = path.resolve(__dirname, "../frontend");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(frontendDir));

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Servidor Resenha Sports funcionando!"
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Servidor Resenha Sports funcionando!"
    });
});

app.use("/api/produtos", produtosRouter);
app.use("/api/pedidos", pedidosRouter);
app.use("/api/pagamentos", pagamentosRouter);
app.use("/produtos", produtosRouter);
app.use("/pedidos", pedidosRouter);
app.use("/pagamentos", pagamentosRouter);

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"));
});

app.use((req, res) => {
    res.status(404).json({
        error: "Rota nao encontrada"
    });
});

async function startServer() {
    try {
        console.log("Preparando banco de dados...");

        await ensureSchema();

        console.log("Banco de dados preparado com sucesso!");

        app.listen(PORT, () => {
            console.log("----------------------------------------");
            console.log("RESENHA SPORTS");
            console.log("----------------------------------------");
            console.log("Servidor rodando na porta " + PORT);
            console.log("http://localhost:" + PORT);
            console.log("http://localhost:" + PORT + "/api/health");
            console.log("----------------------------------------");
        });

    } catch (error) {
        console.error("----------------------------------------");
        console.error("Erro ao preparar o banco de dados:");
        console.error(error.message);
        console.error("----------------------------------------");

        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;
