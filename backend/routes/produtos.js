const express = require('express');
const router = express.Router();
const db = require('../db');

/* READ – listar produtos */
router.get('/', (req, res) => {
  db.query('SELECT * FROM produtos', (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

/* CREATE – cadastrar produto */
router.post('/', (req, res) => {
  const { nome, preco, imagem, descricao } = req.body;

  db.query(
    'INSERT INTO produtos (nome, preco, imagem, descricao) VALUES (?,?,?,?)',
    [nome, preco, imagem, descricao],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Produto cadastrado!' });
    }
  );
});

/* UPDATE – editar produto */
router.put('/:id', (req, res) => {
  const { nome, preco, imagem, descricao } = req.body;
  const { id } = req.params;

  db.query(
    'UPDATE produtos SET nome=?, preco=?, imagem=?, descricao=? WHERE id=?',
    [nome, preco, imagem, descricao, id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Produto atualizado!' });
    }
  );
});

/* DELETE – remover produto */
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM produtos WHERE id=?', [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Produto removido!' });
  });
});

module.exports = router;