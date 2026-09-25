
const db = require("./db");

async function ensureSchema() {

  // ============================================================
  // PRODUTOS - ESTOQUE
  // ============================================================

  const produtoColumns = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'produtos'
      AND column_name = 'estoque'
  `);

  if (produtoColumns.rows.length === 0) {
    await db.query(`
      ALTER TABLE produtos
      ADD COLUMN estoque INTEGER NOT NULL DEFAULT 10
    `);

    console.log("Coluna estoque adicionada em produtos.");
  }

  // ============================================================
  // TABELA DE PEDIDOS
  // ============================================================

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

      status_pagamento VARCHAR(60)
        NOT NULL
        DEFAULT 'Aguardando pagamento',

      status_entrega VARCHAR(60)
        NOT NULL
        DEFAULT 'Pedido recebido',

      total DECIMAL(10,2) NOT NULL,

      mercado_pago_preference_id TEXT,

      mercado_pago_payment_id TEXT,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ============================================================
  // GARANTE COLUNA STATUS_PAGAMENTO
  // ============================================================

  const statusPagamentoColumn = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pedidos'
      AND column_name = 'status_pagamento'
  `);

  if (statusPagamentoColumn.rows.length === 0) {
    await db.query(`
      ALTER TABLE pedidos
      ADD COLUMN status_pagamento VARCHAR(60)
      NOT NULL
      DEFAULT 'Aguardando pagamento'
    `);

    console.log(
      "Coluna status_pagamento adicionada em pedidos."
    );
  }

  // ============================================================
  // ID DA PREFERÊNCIA DO MERCADO PAGO
  // ============================================================

  const preferenceColumn = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pedidos'
      AND column_name = 'mercado_pago_preference_id'
  `);

  if (preferenceColumn.rows.length === 0) {
    await db.query(`
      ALTER TABLE pedidos
      ADD COLUMN mercado_pago_preference_id TEXT
    `);

    console.log(
      "Coluna mercado_pago_preference_id adicionada em pedidos."
    );
  }

  // ============================================================
  // ID DO PAGAMENTO DO MERCADO PAGO
  // ============================================================

  const paymentColumn = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pedidos'
      AND column_name = 'mercado_pago_payment_id'
  `);

  if (paymentColumn.rows.length === 0) {
    await db.query(`
      ALTER TABLE pedidos
      ADD COLUMN mercado_pago_payment_id TEXT
    `);

    console.log(
      "Coluna mercado_pago_payment_id adicionada em pedidos."
    );
  }

  // ============================================================
  // REMOVE ITENS_JSON SE EXISTIR
  // ============================================================

  const columns = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pedidos'
      AND column_name = 'itens_json'
  `);

  if (columns.rows.length > 0) {
    await db.query(`
      ALTER TABLE pedidos
      DROP COLUMN itens_json
    `);

    console.log(
      "Coluna itens_json removida de pedidos."
    );
  }

  // ============================================================
  // TABELA DE ITENS DOS PEDIDOS
  // ============================================================

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

  // ============================================================
  // TABELA DE CLIENTES
  // ============================================================

  await db.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,

      nome VARCHAR(160) NOT NULL,

      email VARCHAR(180) NOT NULL UNIQUE,

      senha VARCHAR(255) NOT NULL,

      telefone VARCHAR(40) DEFAULT '',

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Tabela de clientes verificada com sucesso.");

  // ============================================================
  // VÍNCULO DO PEDIDO COM CLIENTE
  // ============================================================

  await db.query(`
    ALTER TABLE pedidos
    ADD COLUMN IF NOT EXISTS cliente_id INTEGER
  `);

  // ============================================================
  // CÓDIGO DE RASTREIO
  // ============================================================

  await db.query(`
    ALTER TABLE pedidos
    ADD COLUMN IF NOT EXISTS codigo_rastreio VARCHAR(100)
  `);

  // ============================================================
  // FOREIGN KEY CLIENTE -> PEDIDO
  // ============================================================

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'pedidos_cliente_id_fkey'
      ) THEN

        ALTER TABLE pedidos
        ADD CONSTRAINT pedidos_cliente_id_fkey
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE SET NULL;

      END IF;
    END
    $$;
  `);

  console.log(
    "Vínculo de clientes e rastreio verificado com sucesso."
  );

  // ============================================================
  // FINAL
  // ============================================================

  console.log(
    "Schema do banco verificado com sucesso."
  );
}

module.exports = {
  ensureSchema
};

