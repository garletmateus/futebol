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

async function buscarItensPedido(pedidoId) {
  const [rows] = await db.query(
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
     LEFT JOIN produtos p ON p.id = pi.produto_id
     WHERE pi.pedido_id = ?
     ORDER BY pi.id ASC`,
    [pedidoId]
  );

  return mapearItens(rows);
}

router.get("/", async (_req, res) => {
  try {
    const [pedidos] = await db.query(`SELECT * FROM pedidos ORDER BY id DESC`);
    const resposta = await Promise.all(
      pedidos.map(async (pedido) => mapearPedido(pedido, await buscarItensPedido(pedido.id)))
    );
    res.json(resposta);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar pedidos", detalhe: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM pedidos WHERE id = ?", [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ erro: "Pedido não encontrado" });
    }

    const itens = await buscarItensPedido(req.params.id);
    res.json(mapearPedido(rows[0], itens));
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar pedido", detalhe: error.message });
  }
});

router.post("/", async (req, res) => {
  const conexao = await db.getConnection();

  try {
    const body = req.body || {};
    const itens = Array.isArray(body.itens) ? body.itens : [];
    const pedido = {
      clienteNome: String(body.clienteNome || "").trim(),
      telefone: String(body.telefone || "").trim(),
      cep: String(body.cep || "").trim(),
      rua: String(body.rua || "").trim(),
      numero: String(body.numero || "").trim(),
      bairro: String(body.bairro || "").trim(),
      cidade: String(body.cidade || "").trim(),
      complemento: String(body.complemento || "").trim(),
      metodoPagamento: String(body.metodoPagamento || "").trim(),
      statusPagamento: String(body.statusPagamento || "Aguardando pagamento").trim(),
      statusEntrega: String(body.statusEntrega || "Pedido recebido").trim(),
      total: Number(body.total || 0),
      itens
    };

    if (!pedido.clienteNome || !pedido.telefone || !pedido.cep || !pedido.rua || !pedido.numero || !pedido.bairro || !pedido.cidade || !pedido.metodoPagamento || !pedido.total || !pedido.itens.length) {
      conexao.release();
      return res.status(400).json({ erro: "Dados do pedido inválidos" });
    }

    await conexao.beginTransaction();

    const [pedidoResult] = await conexao.execute(
      `INSERT INTO pedidos (
        cliente_nome, telefone, cep, rua, numero, bairro, cidade, complemento,
        metodo_pagamento, status_pagamento, status_entrega, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    for (const item of pedido.itens) {
      await conexao.execute(
        `INSERT INTO pedido_itens (
          pedido_id, produto_id, produto_nome, produto_categoria, produto_imagem,
          preco_unitario, tamanho, quantidade
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pedidoResult.insertId,
          item.id || null,
          String(item.nome || "").trim(),
          String(item.categoria || "").trim(),
          String(item.img || "").trim(),
          Number(item.preco || 0),
          String(item.tamanho || "").trim(),
          Number(item.quantidade || 1)
        ]
      );
    }

    await conexao.commit();
    conexao.release();

    const [pedidoRows] = await db.execute("SELECT * FROM pedidos WHERE id = ?", [pedidoResult.insertId]);
    const itensPedido = await buscarItensPedido(pedidoResult.insertId);
    res.status(201).json(mapearPedido(pedidoRows[0], itensPedido));
  } catch (error) {
    await conexao.rollback();
    conexao.release();
    res.status(500).json({ erro: "Erro ao criar pedido", detalhe: error.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const statusPagamento = req.body.statusPagamento ? String(req.body.statusPagamento).trim() : null;
    const statusEntrega = req.body.statusEntrega ? String(req.body.statusEntrega).trim() : null;

    if (!statusPagamento && !statusEntrega) {
      return res.status(400).json({ erro: "Informe ao menos um status para atualizar" });
    }

    const campos = [];
    const valores = [];

    if (statusPagamento) {
      campos.push("status_pagamento = ?");
      valores.push(statusPagamento);
    }

    if (statusEntrega) {
      campos.push("status_entrega = ?");
      valores.push(statusEntrega);
    }

    valores.push(req.params.id);

    const [result] = await db.execute(`UPDATE pedidos SET ${campos.join(", ")} WHERE id = ?`, valores);

    if (!result.affectedRows) {
      return res.status(404).json({ erro: "Pedido não encontrado" });
    }

    const [rows] = await db.execute("SELECT * FROM pedidos WHERE id = ?", [req.params.id]);
    const itens = await buscarItensPedido(req.params.id);
    res.json(mapearPedido(rows[0], itens));
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar status do pedido", detalhe: error.message });
  }
});

module.exports = router;
