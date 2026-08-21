const db = require("./db");

async function ensureSchema() {
  // Verifica se a coluna estoque existe
  const produtoColumns = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'produtos'
      AND column_name = 'estoque'
  `);

  if (produtoColumns.rows.length === 0) {
    await db.query(`
      ALTER TABLE produtos
      ADD COLUMN estoque INTEGER NOT NULL DEFAULT 10
    `);
  }

  // Tabela de pedidos
  await db.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      cliente_nome VARCHAR(160) NOT NULL,
      telefone VARCHAR(40) NOT NULL,
      cep VARCHAR(20) NOT NULL,
      rua VARCHAR(180) NOT NULL,
      numero VARCHAR(30) NOT NULL,
      bairro VARCHAR(120) NOT NULL,
      cidade VARCHAR(120) NOT NULL,
      complemento VARCHAR(160) DEFAULT '',
      metodo_pagamento VARCHAR(40) NOT NULL,
      status_pagamento VARCHAR(60) NOT NULL DEFAULT 'Aguardando pagamento',
      status_entrega VARCHAR(60) NOT NULL DEFAULT 'Pedido recebido',
      total DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Remove itens_json se existir
  const columns = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'pedidos'
      AND column_name = 'itens_json'
  `);

  if (columns.rows.length > 0) {
    await db.query(`
      ALTER TABLE pedidos
      DROP COLUMN itens_json
    `);
  }

  // Tabela de itens dos pedidos
  await db.query(`
    CREATE TABLE IF NOT EXISTS pedido_itens (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER NOT NULL,
      produto_id INTEGER,
      produto_nome VARCHAR(120) NOT NULL,
      produto_categoria VARCHAR(80) NOT NULL,
      produto_imagem VARCHAR(255) NOT NULL,
      preco_unitario DECIMAL(10,2) NOT NULL,
      tamanho VARCHAR(10) NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 1,

      CONSTRAINT fk_pedido_itens_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE,

      CONSTRAINT fk_pedido_itens_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE SET NULL
    )
  `);
}

module.exports = { ensureSchema };