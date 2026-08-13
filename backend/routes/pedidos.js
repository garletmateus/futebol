const express = require("express");
const router = express.Router();
const db = require("../db");

function mapearItens(rows) {
  return rows.map((row) => ({
    id: row.item_id,
    produtoId: row.produto_id,
    nome: row.produto_nome,
    categoria: row.produto_categoria,
    preco: Number(row.preco_unitario),
    tamanho: row.tamanho,
    quantidade: row.quantidade,
    img: row.imagem_produto || row.produto_imagem || ""
  }));
}

function mapearPedido(row, itens) {
  return {
    id: row.id,
    clienteNome: row.cliente_nome,
    telefone: row.telefone,
    cep: row.cep,
    rua: row.rua,
    numero: row.numero,
    bairro: row.bairro,
    cidade: row.cidade,
    complemento: row.complemento,
    metodoPagamento: row.metodo_pagamento,
    statusPagamento: row.status_pagamento,
    statusEntrega: row.status_entrega,
    total: Number(row.total),
    itens,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// =====================================================
// VERIFICAR SE O PRODUTO EXISTE
// =====================================================

async function resolverProdutoIdValido(produtoId) {
  if (!produtoId) return null;

  const resultado = await db.query(
    "SELECT id FROM produtos WHERE id = $1 LIMIT 1",
    [produtoId]
  );

  return resultado.rows.length
    ? resultado.rows[0].id
    : null;
}

// =====================================================
// BUSCAR ITENS DE UM PEDIDO
// =====================================================

async function buscarItensPedido(pedidoId) {
  const resultado = await db.query(
    `SELECT
       pi.id AS item_id,
       pi.produto_id,
       pi.produto_nome,
       pi.produto_categoria,
       pi.produto_imagem,
       pi.preco_unitario,
       pi.tamanho,
       pi.quantidade,
       p.img AS imagem_produto
     FROM pedido_itens pi
     LEFT JOIN produtos p
       ON p.id = pi.produto_id
     WHERE pi.pedido_id = $1
     ORDER BY pi.id ASC`,
    [pedidoId]
  );

  return mapearItens(resultado.rows);
}

// =====================================================
// LISTAR TODOS OS PEDIDOS
// =====================================================

router.get("/", async (_req, res) => {
  try {
    const resultado = await db.query(
      `SELECT *
       FROM pedidos
       ORDER BY id DESC`
    );

    const pedidos = resultado.rows;

    const resposta = await Promise.all(
      pedidos.map(async (pedido) =>
        mapearPedido(
          pedido,
          await buscarItensPedido(pedido.id)
        )
      )
    );

    res.json(resposta);

  } catch (error) {
    console.error("Erro ao listar pedidos:", error);

    res.status(500).json({
      erro: "Erro ao listar pedidos",
      detalhe: error.message
    });
  }
});

// =====================================================
// BUSCAR PEDIDO POR ID
// =====================================================

router.get("/:id", async (req, res) => {
  try {
    const resultado = await db.query(
      "SELECT * FROM pedidos WHERE id = $1",
      [req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: "Pedido não encontrado"
      });
    }

    const pedido = resultado.rows[0];

    const itens = await buscarItensPedido(
      req.params.id
    );

    res.json(
      mapearPedido(pedido, itens)
    );

  } catch (error) {
    console.error("Erro ao buscar pedido:", error);

    res.status(500).json({
      erro: "Erro ao buscar pedido",
      detalhe: error.message
    });
  }
});

// =====================================================
// CRIAR PEDIDO
// =====================================================

router.post("/", async (req, res) => {
  const client = await db.connect();

  try {
    const body = req.body || {};

    const itens = Array.isArray(body.itens)
      ? body.itens
      : [];

    const pedido = {
      clienteNome: String(
        body.clienteNome || ""
      ).trim(),

      telefone: String(
        body.telefone || ""
      ).trim(),

      cep: String(
        body.cep || ""
      ).trim(),

      rua: String(
        body.rua || ""
      ).trim(),

      numero: String(
        body.numero || ""
      ).trim(),

      bairro: String(
        body.bairro || ""
      ).trim(),

      cidade: String(
        body.cidade || ""
      ).trim(),

      complemento: String(
        body.complemento || ""
      ).trim(),

      metodoPagamento: String(
        body.metodoPagamento || ""
      ).trim(),

      statusPagamento: String(
        body.statusPagamento ||
        "Aguardando pagamento"
      ).trim(),

      statusEntrega: String(
        body.statusEntrega ||
        "Pedido recebido"
      ).trim(),

      total: Number(
        body.total || 0
      ),

      itens
    };

    // =================================================
    // VALIDAR CAMPOS
    // =================================================

    const camposInvalidos = [];

    if (!pedido.clienteNome)
      camposInvalidos.push("nome");

    if (!pedido.telefone)
      camposInvalidos.push("telefone");

    if (!pedido.cep)
      camposInvalidos.push("cep");

    if (!pedido.rua)
      camposInvalidos.push("rua");

    if (!pedido.numero)
      camposInvalidos.push("numero");

    if (!pedido.bairro)
      camposInvalidos.push("bairro");

    if (!pedido.cidade)
      camposInvalidos.push("cidade");

    if (!pedido.metodoPagamento)
      camposInvalidos.push("metodoPagamento");

    if (!pedido.total || pedido.total <= 0)
      camposInvalidos.push("total");

    if (!pedido.itens.length)
      camposInvalidos.push("itens");

    if (camposInvalidos.length) {
      return res.status(400).json({
        erro: "Dados do pedido inválidos",
        detalhe:
          `Campos inválidos: ${camposInvalidos.join(", ")}`
      });
    }

    // =================================================
    // INICIAR TRANSAÇÃO POSTGRESQL
    // =================================================

    await client.query("BEGIN");

    // =================================================
    // INSERIR PEDIDO
    // =================================================

    const pedidoResult = await client.query(
      `INSERT INTO pedidos (
        cliente_nome,
        telefone,
        cep,
        rua,
        numero,
        bairro,
        cidade,
        complemento,
        metodo_pagamento,
        status_pagamento,
        status_entrega,
        total
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12
      )
      RETURNING id`,
      [
        pedido.clienteNome,
        pedido.telefone,
        pedido.cep,
        pedido.rua,
        pedido.numero,
        pedido.bairro,
        pedido.cidade,
        pedido.complemento,
        pedido.metodoPagamento,
        pedido.statusPagamento,
        pedido.statusEntrega,
        pedido.total
      ]
    );

    const pedidoId =
      pedidoResult.rows[0].id;

    // =================================================
    // INSERIR ITENS
    // =================================================

    for (const item of pedido.itens) {
      const produtoIdValido =
        await resolverProdutoIdValido(
          item.id || null
        );

      await client.query(
        `INSERT INTO pedido_itens (
          pedido_id,
          produto_id,
          produto_nome,
          produto_categoria,
          produto_imagem,
          preco_unitario,
          tamanho,
          quantidade
        )
        VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8
        )`,
        [
          pedidoId,

          produtoIdValido,

          String(
            item.nome || ""
          ).trim(),

          String(
            item.categoria || ""
          ).trim(),

          String(
            item.img || ""
          ).trim(),

          Number(
            item.preco || 0
          ),

          String(
            item.tamanho || ""
          ).trim(),

          Number(
            item.quantidade || 1
          )
        ]
      );
    }

    // =================================================
    // COMMIT
    // =================================================

    await client.query("COMMIT");

    // =================================================
    // BUSCAR PEDIDO CRIADO
    // =================================================

    const pedidoRows =
      await db.query(
        "SELECT * FROM pedidos WHERE id = $1",
        [pedidoId]
      );

    const itensPedido =
      await buscarItensPedido(
        pedidoId
      );

    res.status(201).json(
      mapearPedido(
        pedidoRows.rows[0],
        itensPedido
      )
    );

  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    console.error(
      "Erro ao criar pedido:",
      error
    );

    res.status(500).json({
      erro: "Erro ao criar pedido",
      detalhe: error.message
    });

  } finally {
    client.release();
  }
});

// =====================================================
// ATUALIZAR STATUS DO PEDIDO
// =====================================================

router.patch("/:id/status", async (req, res) => {
  try {
    const statusPagamento =
      req.body.statusPagamento
        ? String(
            req.body.statusPagamento
          ).trim()
        : null;

    const statusEntrega =
      req.body.statusEntrega
        ? String(
            req.body.statusEntrega
          ).trim()
        : null;

    if (!statusPagamento && !statusEntrega) {
      return res.status(400).json({
        erro:
          "Informe ao menos um status para atualizar"
      });
    }

    const campos = [];
    const valores = [];

    if (statusPagamento) {
      campos.push(
        `status_pagamento = $${valores.length + 1}`
      );

      valores.push(
        statusPagamento
      );
    }

    if (statusEntrega) {
      campos.push(
        `status_entrega = $${valores.length + 1}`
      );

      valores.push(
        statusEntrega
      );
    }

    valores.push(
      req.params.id
    );

    const idParametro =
      valores.length;

    const updateResult =
      await db.query(
        `UPDATE pedidos
         SET ${campos.join(", ")}
         WHERE id = $${idParametro}`,
        valores
      );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({
        erro: "Pedido não encontrado"
      });
    }

    const resultadoPedido =
      await db.query(
        "SELECT * FROM pedidos WHERE id = $1",
        [req.params.id]
      );

    const itens =
      await buscarItensPedido(
        req.params.id
      );

    res.json(
      mapearPedido(
        resultadoPedido.rows[0],
        itens
      )
    );

  } catch (error) {
    console.error(
      "Erro ao atualizar status:",
      error
    );

    res.status(500).json({
      erro:
        "Erro ao atualizar status do pedido",
      detalhe: error.message
    });
  }
});

module.exports = router;