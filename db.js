const { Client } = require('pg');

// Reemplaza el string de abajo con el 'External Database URL' de Render
const connectionString = "postgresql://dbrosatel_user:cIECNB40sr6Va3GTsqBuBDekt8inXtHU@dpg-d9aohpjtqb8s739l0lg0-a.oregon-postgres.render.com/dbrosatel";

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Esto es obligatorio para conectarse a Render desde afuera
  }
});

client.connect((err) => {
  if (err) {
    console.error("Error conectando a la base de datos PostgreSQL:", err.stack);
    return;
  }
  console.log("Conectado exitosamente a PostgreSQL en Render");
});

module.exports = client;