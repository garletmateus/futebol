const db = require('./db');

async function ensureSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INT NOT NULL AUTO_INCREMENT,
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `);

  const [columns] = await db.query("SHOW COLUMNS FROM pedidos LIKE 'itens_json'");
  if (columns.length) {
    await db.query('ALTER TABLE pedidos DROP COLUMN itens_json');
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS pedido_itens (
      id INT NOT NULL AUTO_INCREMENT,
      pedido_id INT NOT NULL,
      produto_id INT NULL,
      produto_nome VARCHAR(120) NOT NULL,
      produto_categoria VARCHAR(80) NOT NULL,
      produto_imagem VARCHAR(255) NOT NULL,
      preco_unitario DECIMAL(10,2) NOT NULL,
      tamanho VARCHAR(10) NOT NULL,
      quantidade INT NOT NULL DEFAULT 1,
      PRIMARY KEY (id),
      CONSTRAINT fk_pedido_itens_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_pedido_itens_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);
}

module.exports = { ensureSchema };
