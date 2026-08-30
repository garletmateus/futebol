const express = require("express");
const router = express.Router();
const db = require("../db");

function normalizarImagem(img) {
  const valor = String(img || "").trim();

  if (!valor) {
    return "";
  }

  if (/^https?:\/\//i.test(valor)) {
    return valor;
  }

  if (valor.startsWith("/image/")) {
    return valor;
  }

  if (valor.startsWith("./image/")) {
    return valor.replace("./", "/");
  }

  if (valor.startsWith("image/")) {
    return "/" + valor;
  }

  if (valor.includes("/image/")) {
    return valor.slice(valor.indexOf("/image/"));
  }

  return "/image/" + valor.split("/").pop();
}

function normalizarImagens(imagens) {
  if (!Array.isArray(imagens)) {
    return [];
  }

  return imagens
    .map(normalizarImagem)
    .filter(Boolean);
}

function normalizarProduto(body) {
  const tamanhos = Array.isArray(body.tamanhos)
    ? body.tamanhos
    : String(body.tamanhos || "")
        .split(",")
        .map(function (item) {
          return item.trim();
        })
        .filter(Boolean);

  const imagens = Array.isArray(body.imagens)
    ? normalizarImagens(body.imagens)
    : [];

  const imgPrincipal = normalizarImagem(
    body.img || body.imagem || ""
  );

  if (
    imgPrincipal &&
    !imagens.includes(imgPrincipal)
  ) {
    imagens.unshift(imgPrincipal);
  }

  return {
    nome: String(body.nome || "").trim(),

    categoria: String(
      body.categoria || ""
    ).trim(),

    preco: Number(body.preco),

    img: imgPrincipal,

    imagens: imagens,

    descricao: String(
      body.descricao ||
      body.desc ||
      ""
    ).trim(),

    tamanhos: tamanhos,

    estoque: Math.max(
      0,
      Number(body.estoque || 0)
    )
  };
}

function mapearProduto(row) {
  let tamanhos = row.tamanhos;

  if (typeof tamanhos === "string") {
    try {
      tamanhos = JSON.parse(tamanhos);
    } catch (error) {
      tamanhos = [];
    }
  }

  if (!Array.isArray(tamanhos)) {
    tamanhos = [];
  }

  let imagens = row.imagens;

  if (typeof imagens === "string") {
    try {
      imagens = JSON.parse(imagens);
    } catch (error) {
      imagens = [];
    }
  }

  if (!Array.isArray(imagens)) {
    imagens = [];
  }

  imagens = normalizarImagens(imagens);

  const imagemPrincipal = normalizarImagem(row.img);

  if (
    imagemPrincipal &&
    !imagens.includes(imagemPrincipal)
  ) {
    imagens.unshift(imagemPrincipal);
  }

  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    preco: Number(row.preco),
    img: imagemPrincipal,
    imagens: imagens,
    desc: row.descricao,
    tamanhos: tamanhos,
    estoque: Number(row.estoque || 0)
  };
}

// ============================================================
// LISTAR
// ============================================================

router.get("/", async function (req, res) {
  try {
    const result = await db.query(
      `
      SELECT
        id,
        nome,
        categoria,
        preco,
        img,
        descricao,
        tamanhos,
        imagens,
        estoque
      FROM produtos
      ORDER BY id DESC
      `
    );

    res.json(
      result.rows.map(mapearProduto)
    );
  } catch (error) {
    console.error(
      "Erro ao listar produtos:",
      error
    );

    res.status(500).json({
      erro: "Erro ao listar produtos",
      detalhe: error.message
    });
  }
});

// ============================================================
// CADASTRAR
// ============================================================

router.post("/", async function (req, res) {
  try {
    const produto = normalizarProduto(
      req.body
    );

    if (
      !produto.nome ||
      !produto.categoria ||
      !Number.isFinite(produto.preco) ||
      produto.preco <= 0 ||
      !produto.img ||
      !produto.descricao ||
      !produto.tamanhos.length
    ) {
      return res.status(400).json({
        erro: "Dados do produto inválidos."
      });
    }

    const imagens = produto.imagens.length
      ? produto.imagens
      : [produto.img];

    const result = await db.query(
      `
      INSERT INTO produtos
      (
        nome,
        categoria,
        preco,
        img,
        descricao,
        tamanhos,
        imagens,
        estoque
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
      )
      RETURNING
        id,
        nome,
        categoria,
        preco,
        img,
        descricao,
        tamanhos,
        imagens,
        estoque
      `,
      [
        produto.nome,
        produto.categoria,
        produto.preco,
        produto.img,
        produto.descricao,
        JSON.stringify(
          produto.tamanhos
        ),
        JSON.stringify(imagens),
        produto.estoque
      ]
    );

    res.status(201).json(
      mapearProduto(
        result.rows[0]
      )
    );
  } catch (error) {
    console.error(
      "Erro ao cadastrar produto:",
      error
    );

    res.status(500).json({
      erro: "Erro ao cadastrar produto",
      detalhe: error.message
    });
  }
});

// ============================================================
// ATUALIZAR
// ============================================================

router.put("/:id", async function (req, res) {
  try {
    const produto = normalizarProduto(
      req.body
    );

    if (
      !produto.nome ||
      !produto.categoria ||
      !Number.isFinite(produto.preco) ||
      produto.preco <= 0 ||
      !produto.img ||
      !produto.descricao ||
      !produto.tamanhos.length
    ) {
      return res.status(400).json({
        erro: "Dados do produto inválidos."
      });
    }

    const imagens = produto.imagens.length
      ? produto.imagens
      : [produto.img];

    const result = await db.query(
      `
      UPDATE produtos
      SET
        nome = $1,
        categoria = $2,
        preco = $3,
        img = $4,
        descricao = $5,
        tamanhos = $6,
        imagens = $7,
        estoque = $8
      WHERE id = $9
      RETURNING
        id,
        nome,
        categoria,
        preco,
        img,
        descricao,
        tamanhos,
        imagens,
        estoque
      `,
      [
        produto.nome,
        produto.categoria,
        produto.preco,
        produto.img,
        produto.descricao,
        JSON.stringify(
          produto.tamanhos
        ),
        JSON.stringify(imagens),
        produto.estoque,
        req.params.id
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        erro: "Produto não encontrado."
      });
    }

    res.json(
      mapearProduto(
        result.rows[0]
      )
    );
  } catch (error) {
    console.error(
      "Erro ao atualizar produto:",
      error
    );

    res.status(500).json({
      erro: "Erro ao atualizar produto",
      detalhe: error.message
    });
  }
});

// ============================================================
// EXCLUIR
// ============================================================

router.delete("/:id", async function (req, res) {
  try {
    const result = await db.query(
      "DELETE FROM produtos WHERE id = $1",
      [req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        erro: "Produto não encontrado."
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error(
      "Erro ao remover produto:",
      error
    );

    res.status(500).json({
      erro: "Erro ao remover produto",
      detalhe: error.message
    });
  }
});

module.exports = router;