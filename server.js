const express = require("express");
const cors = require("cors");
const path = require("path");

const produtosRouter = require("./backend/routes/produtos");
const pedidosRouter = require("./backend/routes/pedidos");
const { ensureSchema } = require("./backend/ensureSchema");

const app = express();

const PORT = process.env.PORT || 3000;
const frontendDir = path.resolve(__dirname, "frontend");

// =========================
// MIDDLEWARES
// =========================
app.use(cors());
app.use(express.json());

// =========================
// FRONTEND
// =========================
app.use(express.static(frontendDir));

// =========================
// API - HEALTH
// =========================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// =========================
// API - PRODUTOS
// =========================
app.use("/api/produtos", produtosRouter);

// =========================
// API - PEDIDOS
// =========================
app.use("/api/pedidos", pedidosRouter);

// =========================
// PÁGINA INICIAL
// =========================
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

// =========================
// INICIALIZAÇÃO LOCAL
// =========================
if (process.env.VERCEL !== "1") {
  async function startServer() {
    try {
      await ensureSchema();

      app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
      });
    } catch (error) {
      console.error(
        "Erro ao preparar o banco de dados:",
        error.message
      );

      process.exit(1);
    }
  }

  startServer();
}

// =========================
// VERCEL
// =========================
module.exports = app;