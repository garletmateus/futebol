const express = require("express");

const router = express.Router();

const db = require("../db");

// ============================================================
// NORMALIZAR IMAGEM
// ============================================================

function normalizarImagem(img) {
  const valor = String(img || "").trim();

  if (!valor) {
    return "";
  }

  // URL externa
  if (/^https?:\/\//i.test(valor)) {
    return valor;
  }

  // Já está no formato correto
  if (valor.startsWith("/image/")) {
    return valor;
  }

  // ./image/camisa.webp
  if (valor.startsWith("./image/")) {
    return valor.replace("./", "/");
  }

  // image/camisa.webp
  if (valor.startsWith("image/")) {
    return "/" + valor;
  }

  // Caminho contendo /image/
  if (valor.includes("/image/")) {
    return valor.slice(valor.indexOf("/image/"));
  }

  // Apenas nome do arquivo
  return "/image/" + valor.split("/").pop();
}

// ============================================================
// NORMALIZAR IMAGENS
// ============================================================

function normalizarImagens(imagens) {
  if (!Array.isArray(imagens)) {
    return [];
  }

  return imagens
    .map(normalizarImagem)
    .filter(Boolean);
}

// ============================================================
// NORMALIZAR VITRINES
// ============================================================

function normalizarVitrines(vitrines) {
  if (Array.isArray(vitrines)) {
    return vitrines
      .map(function (item) {
        return String(item || "")
          .trim()
          .toLowerCase();
      })
      .filter(Boolean);
  }

  if (typeof vitrines === "string") {
    const texto = vitrines.trim();

    if (!texto) {
      return [];
    }

    // Tenta JSON
    try {
      const resultado = JSON.parse(texto);

      if (Array.isArray(resultado)) {
        return resultado
          .map(function (item) {
            return String(item || "")
              .trim()
              .toLowerCase();
          })
          .filter(Boolean);
      }

      // Caso venha JSON como string
      if (typeof resultado === "string") {
        return resultado
          .split(",")
          .map(function (item) {
            return item.trim().toLowerCase();
          })
          .filter(Boolean);
      }
    } catch (error) {
      // Não é JSON.
      // Continua como lista separada por vírgula.
    }

    return texto
      .split(",")
      .map(function (item) {
        return item.trim().toLowerCase();
      })
      .filter(Boolean);
  }

  return [];
}

// ============================================================
// NORMALIZAR PRODUTO RECEBIDO DO FRONTEND
// ============================================================

function normalizarProduto(body) {
  body = body || {};

  // ==========================================================
  // TAMANHOS
  // ==========================================================

  const tamanhos =
    Array.isArray(body.tamanhos)
      ? body.tamanhos
          .map(function (item) {
            return String(item || "").trim();
          })
          .filter(Boolean)
      : String(body.tamanhos || "")
          .split(",")
          .map(function (item) {
            return item.trim();
          })
          .filter(Boolean);

  // ==========================================================
  // IMAGENS
  // ==========================================================

  const imagens =
    Array.isArray(body.imagens)
      ? normalizarImagens(body.imagens)
      : [];

  const imgPrincipal = normalizarImagem(
    body.img ||
      body.imagem ||
      ""
  );

  // Garante que a imagem principal
  // também esteja na galeria
  if (
    imgPrincipal &&
    !imagens.includes(imgPrincipal)
  ) {
    imagens.unshift(imgPrincipal);
  }

  // ==========================================================
  // VITRINES
  // ==========================================================
  //
  // Aceita:
  // body.vitrines
  // body.secoes
  // body.vitrine
  //
  // Isso deixa o backend compatível com
  // diferentes versões do painel.
  //

  let vitrines =
    body.vitrines ??
    body.secoes ??
    body.vitrine ??
    [];

  vitrines = normalizarVitrines(vitrines);

  // Remove duplicadas
  vitrines = [...new Set(vitrines)];

  // ==========================================================
  // PRODUTO
  // ==========================================================

  return {
    nome: String(
      body.nome || ""
    ).trim(),

    categoria: String(
      body.categoria || ""
    ).trim(),

    preco: Number(
      body.preco
    ),

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
    ),

    vitrines: vitrines
  };
}

// ============================================================
// MAPEAR PRODUTO DO BANCO
// ============================================================

function mapearProduto(row) {
  // ==========================================================
  // TAMANHOS
  // ==========================================================

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

  tamanhos = tamanhos
    .map(function (item) {
      return String(item || "").trim();
    })
    .filter(Boolean);

  // ==========================================================
  // IMAGENS
  // ==========================================================

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

  // ==========================================================
  // IMAGEM PRINCIPAL
  // ==========================================================

  const imagemPrincipal =
    normalizarImagem(row.img);

  // Garante que a principal esteja
  // também dentro da galeria
  if (
    imagemPrincipal &&
    !imagens.includes(imagemPrincipal)
  ) {
    imagens.unshift(imagemPrincipal);
  }

  // ==========================================================
  // VITRINES
  // ==========================================================

  let vitrines = row.vitrines;

  if (typeof vitrines === "string") {
    try {
      vitrines = JSON.parse(vitrines);
    } catch (error) {
      vitrines = vitrines
        .split(",")
        .map(function (item) {
          return item.trim();
        })
        .filter(Boolean);
    }
  }

  if (!Array.isArray(vitrines)) {
    vitrines = [];
  }

  vitrines = vitrines
    .map(function (item) {
      return String(item || "")
        .trim()
        .toLowerCase();
    })
    .filter(Boolean);

  vitrines = [...new Set(vitrines)];

  // ==========================================================
  // RETORNO
  // ==========================================================

  return {
    id: row.id,

    nome: row.nome,

    categoria: row.categoria,

    preco: Number(
      row.preco
    ),

    img: imagemPrincipal,

    imagens: imagens,

    desc: row.descricao || "",

    descricao: row.descricao || "",

    tamanhos: tamanhos,

    estoque: Number(
      row.estoque || 0
    ),

    vitrines: vitrines,

    // Também envia como "secoes"
    // para facilitar o frontend.
    secoes: vitrines
  };
}

// ============================================================
// LISTAR PRODUTOS
// ============================================================

router.get(
  "/",
  async function (req, res) {
    try {
      const result =
        await db.query(`
          SELECT
            id,
            nome,
            categoria,
            preco,
            img,
            descricao,
            tamanhos,
            imagens,
            estoque,
            vitrines
          FROM produtos
          ORDER BY id DESC
        `);

      res.json(
        result.rows.map(
          mapearProduto
        )
      );

    } catch (error) {
      console.error(
        "Erro ao listar produtos:",
        error
      );

      res.status(500).json({
        erro:
          "Erro ao listar produtos",

        detalhe:
          error.message
      });
    }
  }
);

// ============================================================
// BUSCAR PRODUTO POR ID
// ============================================================

router.get(
  "/:id",
  async function (req, res) {
    try {
      const result =
        await db.query(
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
            estoque,
            vitrines
          FROM produtos
          WHERE id = $1
          `,
          [req.params.id]
        );

      if (!result.rows.length) {
        return res.status(404).json({
          erro:
            "Produto não encontrado."
        });
      }

      res.json(
        mapearProduto(
          result.rows[0]
        )
      );

    } catch (error) {
      console.error(
        "Erro ao buscar produto:",
        error
      );

      res.status(500).json({
        erro:
          "Erro ao buscar produto",

        detalhe:
          error.message
      });
    }
  }
);

// ============================================================
// CADASTRAR PRODUTO
// ============================================================

router.post(
  "/",
  async function (req, res) {
    try {
      const produto =
        normalizarProduto(
          req.body
        );

      // ======================================================
      // VALIDAR
      // ======================================================

      if (
        !produto.nome ||
        !produto.categoria ||
        !Number.isFinite(
          produto.preco
        ) ||
        produto.preco <= 0 ||
        !produto.img ||
        !produto.descricao ||
        !produto.tamanhos.length
      ) {
        return res.status(400).json({
          erro:
            "Dados do produto inválidos."
        });
      }

      // ======================================================
      // IMAGENS
      // ======================================================

      const imagens =
        produto.imagens.length
          ? produto.imagens
          : [produto.img];

      // ======================================================
      // VITRINES
      // ======================================================

      const vitrines =
        produto.vitrines;

      // ======================================================
      // INSERT
      // ======================================================

      const result =
        await db.query(
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
            estoque,
            vitrines
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
            $8,
            $9
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
            estoque,
            vitrines
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

            JSON.stringify(
              imagens
            ),

            produto.estoque,

            JSON.stringify(
              vitrines
            )
          ]
        );

      // ======================================================
      // RESPOSTA
      // ======================================================

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
        erro:
          "Erro ao cadastrar produto",

        detalhe:
          error.message
      });
    }
  }
);

// ============================================================
// ATUALIZAR PRODUTO
// ============================================================

router.put(
  "/:id",
  async function (req, res) {
    try {
      const produto =
        normalizarProduto(
          req.body
        );

      // ======================================================
      // VALIDAR
      // ======================================================

      if (
        !produto.nome ||
        !produto.categoria ||
        !Number.isFinite(
          produto.preco
        ) ||
        produto.preco <= 0 ||
        !produto.img ||
        !produto.descricao ||
        !produto.tamanhos.length
      ) {
        return res.status(400).json({
          erro:
            "Dados do produto inválidos."
        });
      }

      // ======================================================
      // IMAGENS
      // ======================================================

      const imagens =
        produto.imagens.length
          ? produto.imagens
          : [produto.img];

      // ======================================================
      // VITRINES
      // ======================================================

      const vitrines =
        produto.vitrines;

      // ======================================================
      // UPDATE
      // ======================================================

      const result =
        await db.query(
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
            estoque = $8,
            vitrines = $9
          WHERE id = $10
          RETURNING
            id,
            nome,
            categoria,
            preco,
            img,
            descricao,
            tamanhos,
            imagens,
            estoque,
            vitrines
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

            JSON.stringify(
              imagens
            ),

            produto.estoque,

            JSON.stringify(
              vitrines
            ),

            req.params.id
          ]
        );

      // ======================================================
      // NÃO ENCONTRADO
      // ======================================================

      if (
        !result.rows.length
      ) {
        return res.status(404).json({
          erro:
            "Produto não encontrado."
        });
      }

      // ======================================================
      // RESPOSTA
      // ======================================================

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
        erro:
          "Erro ao atualizar produto",

        detalhe:
          error.message
      });
    }
  }
);

// ============================================================
// EXCLUIR PRODUTO
// ============================================================

router.delete(
  "/:id",
  async function (req, res) {
    try {
      const result =
        await db.query(
          `
          DELETE FROM produtos
          WHERE id = $1
          `,
          [
            req.params.id
          ]
        );

      if (
        !result.rowCount
      ) {
        return res.status(404).json({
          erro:
            "Produto não encontrado."
        });
      }

      res.status(204).send();

    } catch (error) {
      console.error(
        "Erro ao remover produto:",
        error
      );

      res.status(500).json({
        erro:
          "Erro ao remover produto",

        detalhe:
          error.message
      });
    }
  }
);

// ============================================================
// EXPORTAR
// ============================================================

module.exports = router;