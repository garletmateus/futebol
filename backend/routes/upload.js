const express = require("express");
const multer = require("multer");

const router = express.Router();

const supabase = require("../supabase");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif"
    ];

    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(
        new Error(
          "Formato inválido. Use JPG, PNG, WEBP ou GIF."
        )
      );
    }

    cb(null, true);
  }
});

function criarNomeArquivo(originalName) {
  const extensao = originalName
    .split(".")
    .pop()
    .toLowerCase();

  const nomeBase = originalName
    .replace(/\.[^/.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const timestamp = Date.now();
  const aleatorio = Math.random()
    .toString(36)
    .substring(2, 8);

  return `${nomeBase || "produto"}-${timestamp}-${aleatorio}.${extensao}`;
}

router.post(
  "/",
  upload.array("imagens", 10),
  async (req, res) => {
    try {
      if (!req.files || !req.files.length) {
        return res.status(400).json({
          erro: "Nenhuma imagem foi enviada."
        });
      }

      const imagens = [];

      for (const arquivo of req.files) {
        const nomeArquivo = criarNomeArquivo(
          arquivo.originalname
        );

        const caminho = `produtos/${nomeArquivo}`;

        const { error } = await supabase.storage
          .from("image")
          .upload(caminho, arquivo.buffer, {
            contentType: arquivo.mimetype,
            upsert: false
          });

        if (error) {
          console.error(
            "Erro no upload do Supabase:",
            error
          );

          return res.status(500).json({
            erro: "Erro ao enviar imagem para o Supabase.",
            detalhe: error.message
          });
        }

        const { data } = supabase.storage
          .from("image")
          .getPublicUrl(caminho);

        if (!data || !data.publicUrl) {
          return res.status(500).json({
            erro: "Não foi possível obter a URL pública da imagem."
          });
        }

        imagens.push(data.publicUrl);
      }

      res.status(201).json({
        sucesso: true,
        imagens
      });
    } catch (error) {
      console.error(
        "Erro no upload:",
        error
      );

      res.status(500).json({
        erro: "Erro ao fazer upload das imagens.",
        detalhe: error.message
      });
    }
  }
);

module.exports = router;