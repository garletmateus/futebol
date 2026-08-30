
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const produtosRouter = require("./backend/routes/produtos");
const pedidosRouter = require("./backend/routes/pedidos");
const { ensureSchema } = require("./backend/ensureSchema");

const app = express();

const PORT = process.env.PORT || 3000;
const frontendDir = path.resolve(__dirname, "frontend");

// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error(
    "ERRO: SUPABASE_URL não foi encontrada no arquivo .env"
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "ERRO: SUPABASE_SERVICE_ROLE_KEY não foi encontrada no arquivo .env"
  );
}

let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );
}

// ============================================================
// MIDDLEWARES
// ============================================================

app.use(cors());

app.use(
  express.json({
    limit: "10mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb"
  })
);

// ============================================================
// FRONTEND
// ============================================================

app.use(express.static(frontendDir));

// ============================================================
// HEALTH
// ============================================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// ============================================================
// MULTER
// ============================================================

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
      "image/webp"
    ];

    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(
        new Error(
          "Formato de imagem não permitido. Use JPG, PNG ou WEBP."
        )
      );
    }

    cb(null, true);
  }
});

// ============================================================
// UPLOAD DE IMAGEM PARA SUPABASE STORAGE
// ============================================================

app.post(
  "/api/upload-imagem",
  upload.single("imagem"),
  async (req, res) => {
    try {
      // Verifica se recebeu o arquivo
      if (!req.file) {
        return res.status(400).json({
          sucesso: false,
          erro: "Nenhuma imagem foi enviada."
        });
      }

      // Verifica configuração do Supabase
      if (!supabase) {
        return res.status(500).json({
          sucesso: false,
          erro: "Supabase não está configurado no servidor."
        });
      }

      // Extensão original
      const extensaoOriginal = path
        .extname(req.file.originalname)
        .toLowerCase();

      const extensoesPermitidas = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
      ];

      if (!extensoesPermitidas.includes(extensaoOriginal)) {
        return res.status(400).json({
          sucesso: false,
          erro: "Extensão de imagem não permitida."
        });
      }

      // Nome original sem extensão
      let nomeBase = path
        .basename(
          req.file.originalname,
          extensaoOriginal
        )
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (!nomeBase) {
        nomeBase = "imagem";
      }

      // Nome único
      const nomeArquivo =
        String(Date.now()) +
        "-" +
        nomeBase +
        extensaoOriginal;

      // Pasta dentro do bucket
      const caminho =
        "produtos/" + nomeArquivo;

      console.log(
        "=========================================="
      );

      console.log(
        "UPLOAD DE IMAGEM"
      );

      console.log(
        "Arquivo:",
        req.file.originalname
      );

      console.log(
        "Destino:",
        caminho
      );

      // ========================================================
      // ENVIA PARA O BUCKET
      // ========================================================

      const resultadoUpload =
        await supabase.storage
          .from("image")
          .upload(
            caminho,
            req.file.buffer,
            {
              contentType: req.file.mimetype,
              cacheControl: "3600",
              upsert: false
            }
          );

      const uploadError =
        resultadoUpload.error;

      if (uploadError) {
        console.error(
          "Erro no upload para Supabase:",
          uploadError
        );

        return res.status(500).json({
          sucesso: false,
          erro: "Não foi possível enviar a imagem.",
          detalhe: uploadError.message
        });
      }

      // ========================================================
      // GERA URL PÚBLICA
      // ========================================================

      const resultadoUrl =
        supabase.storage
          .from("image")
          .getPublicUrl(caminho);

      const publicUrlData =
        resultadoUrl.data;

      if (
        !publicUrlData ||
        !publicUrlData.publicUrl
      ) {
        return res.status(500).json({
          sucesso: false,
          erro:
            "Imagem enviada, mas não foi possível gerar a URL pública."
        });
      }

      const url =
        publicUrlData.publicUrl;

      console.log(
        "Imagem enviada com sucesso."
      );

      console.log(
        "URL:",
        url
      );

      console.log(
        "=========================================="
      );

      // ========================================================
      // RETORNO PARA O PAINEL
      // ========================================================

      return res.status(201).json({
        sucesso: true,
        mensagem: "Imagem enviada com sucesso.",
        arquivo: nomeArquivo,
        caminho: caminho,
        url: url
      });

    } catch (error) {
      console.error(
        "Erro no endpoint de upload:",
        error
      );

      return res.status(500).json({
        sucesso: false,
        erro: "Erro ao fazer upload da imagem.",
        detalhe:
          error.message ||
          "Erro desconhecido."
      });
    }
  }
);

// ============================================================
// PRODUTOS
// ============================================================

app.use(
  "/api/produtos",
  produtosRouter
);

// ============================================================
// PEDIDOS
// ============================================================

app.use(
  "/api/pedidos",
  pedidosRouter
);

// ============================================================
// PÁGINA INICIAL
// ============================================================

app.get("/", (req, res) => {
  res.sendFile(
    path.join(
      frontendDir,
      "index.html"
    )
  );
});

// ============================================================
// TRATAMENTO DE ERROS DO MULTER
// ============================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof multer.MulterError
    ) {
      return res.status(400).json({
        sucesso: false,
        erro: "Erro no envio da imagem.",
        detalhe: error.message
      });
    }

    if (error) {
      return res.status(400).json({
        sucesso: false,
        erro:
          error.message ||
          "Erro inesperado."
      });
    }

    next();
  }
);

// ============================================================
// INICIALIZAÇÃO LOCAL
// ============================================================

if (process.env.VERCEL !== "1") {
  async function startServer() {
    try {
      await ensureSchema();

      app.listen(
        PORT,
        () => {
          console.log(
            "=========================================="
          );

          console.log(
            "RESENHA SPORTS"
          );

          console.log(
            "Servidor iniciado com sucesso!"
          );

          console.log(
            "Frontend: http://localhost:" +
              PORT
          );

          console.log(
            "API: http://localhost:" +
              PORT +
              "/api"
          );

          console.log(
            "Upload: http://localhost:" +
              PORT +
              "/api/upload-imagem"
          );

          console.log(
            "=========================================="
          );
        }
      );

    } catch (error) {
      console.error(
        "Erro ao preparar o banco de dados:",
        error.message
      );

      process.exit(1);
    }
  }

  startServer();
}

// ============================================================
// VERCEL
// ============================================================

module.exports = app;

