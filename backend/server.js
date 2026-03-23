const express = require("express");
const cors = require("cors");
const path = require("path");
const produtosRouter = require("./routes/produtos");

const app = express();
const PORT = process.env.PORT || 3000;
const frontendDir = path.resolve(__dirname, "../frontend");

app.use(cors());
app.use(express.json());
app.use(express.static(frontendDir));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/produtos", produtosRouter);

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
