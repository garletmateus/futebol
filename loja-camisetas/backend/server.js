import express from "express";
import cors from "cors";
import produtosRoutes from "./routes/produtos.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/produtos", produtosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});