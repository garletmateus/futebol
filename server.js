const express = require("express");
const cors = require("cors");
const path = require("path");

const produtosRouter = require("./backend/routes/produtos");
const pedidosRouter = require("./backend/routes/pedidos");
const { ensureSchema } = require("./backend/ensureSchema");

const app = express();

const PORT = process.env.PORT || 3000;
const frontendDir = path.resolve(__dirname, "frontend");

// Middlewares
app.use(cors());
app.use(express.json());

// Frontend
app.use(express.static(frontendDir));

// API - Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API - Produtos
app.use("/api/produtos", produtosRouter);

// API - Pedidos
app.use("/api/pedidos", pedidosRouter);

// Página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

// Inicialização
async function startServer() {
  try {
    await ensureSchema();

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao preparar o banco de dados:", error.message);
    process.exit(1);
  }
}

// IMPORTANTE: iniciar o servidor
startServer();