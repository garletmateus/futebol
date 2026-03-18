const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// conexão
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // sua senha aqui
  database: "loja"
});

// TESTE
db.connect(err => {
  if(err) console.log(err);
  else console.log("Banco conectado");
});

// ROTAS

// listar produtos
app.get("/produtos", (req,res)=>{
  db.query("SELECT * FROM produtos",(err,result)=>{
    res.json(result);
  });
});

// adicionar produto
app.post("/produtos",(req,res)=>{

  const {nome,preco,img} = req.body;

  db.query(
    "INSERT INTO produtos (nome,preco,img) VALUES (?,?,?)",
    [nome,preco,img],
    ()=> res.send("OK")
  );
});

// deletar
app.delete("/produtos/:id",(req,res)=>{
  db.query("DELETE FROM produtos WHERE id=?",[req.params.id],
  ()=> res.send("DELETADO"));
});

app.listen(3000, ()=> console.log("Servidor rodando"));