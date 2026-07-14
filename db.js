const mysql = require("mysql2");


const connection = mysql.createConnection({
  host: "bxkdczq5i3bs7nbdrlvg-mysql.services.clever-cloud.com",
  user: "umwtxaoqlooelqc7",
  password: "Nb42rWYvq3I81LCtoHEE",
  database: "bxkdczq5i3bs7nbdrlvg",
});

connection.connect((err) => { 
  if (err) { 
    console.error("Error conectando a la base de datos: " + err.stack); 
    return;
  }
  console.log("Conectado a la base de datos");
});

module.exports = connection;
