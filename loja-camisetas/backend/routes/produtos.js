import express from "express";
const router = express.Router();

const produtos = [
  { id: 1, time: "Flamengo", preco: 79.90, imagem: "https://via.placeholder.com/200" },
  { id: 2, time: "Corinthians", preco: 89.90, imagem: "https://via.placeholder.com/200" },
  { id: 3, time: "Palmeiras", preco: 84.90, imagem: "https://via.placeholder.com/200" }
];

router.get("/", (req, res) => {
  res.json(produtos);
});

export default router;