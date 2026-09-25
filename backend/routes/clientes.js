const express = require("express");
const router = express.Router();
const db = require("../db");

// ===============================
// CADASTRO DE CLIENTE
// ===============================
router.post("/cadastro", async (req, res) => {
  try {
    const { nome, email, senha, telefone } = req.body;

    const nomeLimpo = String(nome || "").trim();
    const emailLimpo = String(email || "").trim().toLowerCase();
    const senhaLimpa = String(senha || "").trim();
    const telefoneLimpo = String(telefone || "").trim();

    if (!nomeLimpo || !emailLimpo || !senhaLimpa) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nome, e-mail e senha são obrigatórios."
      });
    }

    if (senhaLimpa.length < 6) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A senha deve ter pelo menos 6 caracteres."
      });
    }

    const clienteExistente = await db.query(
      "SELECT id FROM clientes WHERE email = $1",
      [emailLimpo]
    );

    if (clienteExistente.rows.length > 0) {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Este e-mail já está cadastrado."
      });
    }

    const resultado = await db.query(
      `
      INSERT INTO clientes
      (nome, email, senha, telefone)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nome, email, telefone, created_at
      `,
      [
        nomeLimpo,
        emailLimpo,
        senhaLimpa,
        telefoneLimpo
      ]
    );

    const cliente = resultado.rows[0];

    return res.status(201).json({
      sucesso: true,
      mensagem: "Cadastro realizado com sucesso.",
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone
      }
    });

  } catch (erro) {
    console.error("Erro no cadastro:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao cadastrar cliente."
    });
  }
});


// ===============================
// LOGIN DO CLIENTE
// ===============================
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const emailLimpo = String(email || "").trim().toLowerCase();
    const senhaLimpa = String(senha || "").trim();

    if (!emailLimpo || !senhaLimpa) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe o e-mail e a senha."
      });
    }

    const resultado = await db.query(
      `
      SELECT
        id,
        nome,
        email,
        senha,
        telefone
      FROM clientes
      WHERE email = $1
      `,
      [emailLimpo]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "E-mail ou senha incorretos."
      });
    }

    const cliente = resultado.rows[0];

    if (cliente.senha !== senhaLimpa) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "E-mail ou senha incorretos."
      });
    }

    return res.json({
      sucesso: true,
      mensagem: "Login realizado com sucesso.",
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone
      }
    });

  } catch (erro) {
    console.error("Erro no login:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao realizar login."
    });
  }
});


// ===============================
// BUSCAR CLIENTE
// ===============================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await db.query(
      `
      SELECT
        id,
        nome,
        email,
        telefone,
        created_at
      FROM clientes
      WHERE id = $1
      `,
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Cliente não encontrado."
      });
    }

    return res.json({
      sucesso: true,
      cliente: resultado.rows[0]
    });

  } catch (erro) {
    console.error("Erro ao buscar cliente:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao buscar cliente."
    });
  }
});


// IMPORTANTE:
// O router precisa ser exportado aqui.
module.exports = router;