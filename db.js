const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "hayabusa.proxy.rlwy.net",
  port: 44512,
  user: "root",
  password: "klILPHjjCuwYonuXEJiqpyxHJcRmPlpl",
  database: "railway",
});

connection.connect((err) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err);
    return;
  }
  console.log("Conectado a Railway MySQL");
});

module.exports = connection;