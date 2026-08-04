const express = require("express");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const db = require("../db");

const router = express.Router();

const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;

function criarClienteMercadoPago() {
  const accessToken = String(process.env.MERCADO_PAGO_ACCESS_TOKEN || "").trim();

  if (!accessToken) {
    throw new Error("Configure MERCADO_PAGO_ACCESS_TOKEN no arquivo .env");
  }

  return new MercadoPagoConfig({ accessToken });
}

function normalizarItens(itens) {
  return itens.map((item) => ({
    title: String(item.nome || "Camisa Resenha Sports").trim(),
    quantity: Number(item.quantidade || 1),
    unit_price: Number(item.preco || 0),
    currency_id: "BRL"
  }));
}

router.post("/mercadopago", async (req, res) => {
  try {
    const pedidoId = Number(req.body.pedidoId);
    const itens = Array.isArray(req.body.itens) ? req.body.itens : [];

    if (!pedidoId || !itens.length) {
      return res.status(400).json({ erro: "Informe o pedido e os itens para criar o pagamento." });
    }

    const [pedidoRows] = await db.execute("SELECT id, total FROM pedidos WHERE id = ?", [pedidoId]);
    if (!pedidoRows.length) {
      return res.status(404).json({ erro: "Pedido nao encontrado." });
    }

    const preference = new Preference(criarClienteMercadoPago());
    const result = await preference.create({
      body: {
        items: normalizarItens(itens),
        external_reference: String(pedidoId),
        back_urls: {
          success: `${appUrl}/confirmacao.html?status=approved&pedido=${pedidoId}`,
          failure: `${appUrl}/confirmacao.html?status=failure&pedido=${pedidoId}`,
          pending: `${appUrl}/confirmacao.html?status=pending&pedido=${pedidoId}`
        },
        notification_url: `${appUrl}/api/pagamentos/mercadopago/webhook`,
        statement_descriptor: "RESENHA SPORTS"
      }
    });

    await db.execute(
      `UPDATE pedidos
       SET mercado_pago_preference_id = ?, status_pagamento = ?
       WHERE id = ?`,
      [result.id, "Aguardando pagamento", pedidoId]
    );

    res.json({
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point
    });
  } catch (error) {
    console.error("Erro Mercado Pago:", error);
    res.status(500).json({ erro: "Erro ao criar pagamento no Mercado Pago.", detalhe: error.message });
  }
});

router.post("/mercadopago/webhook", async (req, res) => {
  try {
    const tipo = req.body.type || req.query.type || req.query.topic;
    const paymentId = req.body?.data?.id || req.query.id;

    if (tipo !== "payment" || !paymentId) {
      return res.sendStatus(200);
    }

    const payment = new Payment(criarClienteMercadoPago());
    const dadosPagamento = await payment.get({ id: paymentId });
    const pedidoId = Number(dadosPagamento.external_reference);

    if (!pedidoId) {
      return res.sendStatus(200);
    }

    const statusPorPagamento = {
      approved: "Pago",
      pending: "Pendente",
      in_process: "Em analise",
      rejected: "Recusado",
      cancelled: "Cancelado",
      refunded: "Reembolsado",
      charged_back: "Contestada"
    };

    await db.execute(
      `UPDATE pedidos
       SET mercado_pago_payment_id = ?, status_pagamento = ?
       WHERE id = ?`,
      [
        String(dadosPagamento.id),
        statusPorPagamento[dadosPagamento.status] || dadosPagamento.status || "Aguardando pagamento",
        pedidoId
      ]
    );

    res.sendStatus(200);
  } catch (error) {
    console.error("Erro webhook Mercado Pago:", error);
    res.sendStatus(500);
  }
});

module.exports = router;
