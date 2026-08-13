const db = require("./db");

async function ensureSchema() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS produtos (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(120) NOT NULL,
            categoria VARCHAR(80) NOT NULL,
            preco NUMERIC(10, 2) NOT NULL,
            img VARCHAR(255) NOT NULL,
            imagens JSONB DEFAULT '[]'::jsonb,
            descricao TEXT NOT NULL,
            tamanhos JSONB NOT NULL DEFAULT '[]'::jsonb,
            estoque INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

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
            total NUMERIC(10, 2) NOT NULL,
            mercado_pago_preference_id VARCHAR(120),
            mercado_pago_payment_id VARCHAR(120),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS pedido_itens (
            id SERIAL PRIMARY KEY,
            pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
            produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
            produto_nome VARCHAR(120) NOT NULL,
            produto_categoria VARCHAR(80) NOT NULL,
            produto_imagem VARCHAR(255) NOT NULL,
            preco_unitario NUMERIC(10, 2) NOT NULL,
            tamanho VARCHAR(10) NOT NULL,
            quantidade INTEGER NOT NULL DEFAULT 1
        )
    `);
}

module.exports = {
    ensureSchema
};
