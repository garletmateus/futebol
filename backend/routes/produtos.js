const express = require("express");
const router = express.Router();
const db = require("../db");

function normalizarImagem(img) {
  const valor = String(img || "").trim().replace(/\\/g, "/");
  if (!valor) return "/image/camisa.gif";
  if (/^https?:\/\//i.test(valor)) return valor;
  if (valor.startsWith("/image/")) return valor;
  if (valor.startsWith("./image/")) return valor.replace("./", "/");
  if (valor.startsWith("image/")) return `/${valor}`;
  if (valor.includes("/image/")) return valor.slice(valor.indexOf("/image/"));
  return `/image/${valor.split("/").pop()}`;
}

function normalizarProduto(body) {
  const tamanhos = Array.isArray(body.tamanhos)
    ? body.tamanhos
    : String(body.tamanhos || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    nome: String(body.nome || "").trim(),
    categoria: String(body.categoria || "").trim(),
    preco: Number(body.preco),
    img: String(body.img || body.imagem || "").trim(),
    descricao: String(body.descricao || body.desc || "").trim(),
    tamanhos
  };
}

function mapearProduto(row) {
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    preco: Number(row.preco),
    img: normalizarImagem(row.img),
    desc: row.descricao,
    tamanhos: Array.isArray(row.tamanhos) ? row.tamanhos : JSON.parse(row.tamanhos || "[]")
  };
}

router.get("/", async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, nome, categoria, preco, img, descricao, tamanhos
      FROM produtos
      ORDER BY id DESC
    `);

    res.json(rows.map(mapearProduto));
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar produtos", detalhe: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const produto = normalizarProduto(req.body);

    if (!produto.nome || !produto.categoria || !produto.preco || !produto.img || !produto.descricao || !produto.tamanhos.length) {
      return res.status(400).json({ erro: "Dados do produto inválidos" });
    }

    const [result] = await db.execute(
      `INSERT INTO produtos (nome, categoria, preco, img, descricao, tamanhos) VALUES (?, ?, ?, ?, ?, ?)`,
      [produto.nome, produto.categoria, produto.preco, produto.img, produto.descricao, JSON.stringify(produto.tamanhos)]
    );

    const [rows] = await db.execute(
      `SELECT id, nome, categoria, preco, img, descricao, tamanhos FROM produtos WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(mapearProduto(rows[0]));
  } catch (error) {
    res.status(500).json({ erro: "Erro ao cadastrar produto", detalhe: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const produto = normalizarProduto(req.body);

    if (!produto.nome || !produto.categoria || !produto.preco || !produto.img || !produto.descricao || !produto.tamanhos.length) {
      return res.status(400).json({ erro: "Dados do produto inválidos" });
    }

    const [result] = await db.execute(
      `UPDATE produtos SET nome = ?, categoria = ?, preco = ?, img = ?, descricao = ?, tamanhos = ? WHERE id = ?`,
      [produto.nome, produto.categoria, produto.preco, produto.img, produto.descricao, JSON.stringify(produto.tamanhos), req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }

    const [rows] = await db.execute(
      `SELECT id, nome, categoria, preco, img, descricao, tamanhos FROM produtos WHERE id = ?`,
      [req.params.id]
    );

    res.json(mapearProduto(rows[0]));
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar produto", detalhe: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM produtos WHERE id = ?", [req.params.id]);

    if (!result.affectedRows) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ erro: "Erro ao remover produto", detalhe: error.message });
  }
});

module.exports = router;
