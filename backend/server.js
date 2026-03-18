const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// listar produtos
app.get("/produtos", (req, res) => {
  db.query("SELECT * FROM produtos", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});

// adicionar produto
app.post("/produtos", (req, res) => {
  const { nome, preco, img } = req.body;

  db.query(
    "INSERT INTO produtos (nome, preco, img) VALUES (?, ?, ?)",
    [nome, preco, img],
    (err) => {
      if (err) return res.send(err);
      res.send("Produto cadastrado");
    }
  );
});

// deletar
app.delete("/produtos/:id", (req, res) => {
  db.query(
    "DELETE FROM produtos WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.send(err);
      res.send("Deletado");
    }
  );
});

app.listen(3000, () => console.log("Servidor rodando"));