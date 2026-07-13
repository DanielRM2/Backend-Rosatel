const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const path = require("path");
const connection = require("./db");
const jwt = require("jsonwebtoken");
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const SECRET_KEY = "41DSD1e3qw5wF-d_:Der61ttArIDtrgvjfASI$1@";

/* =========================
   REGISTRO
========================= */
app.post("/api/registro", (req, res) => {

  const { dni, nombre, correo, contraseña, direccion, telefono } = req.body;

  if (!dni || !nombre || !correo || !contraseña) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const queryCheck = "SELECT * FROM usuarios WHERE DNI = ? OR Correo = ?";

  connection.query(queryCheck, [dni, correo], (err, results) => {
    if (err) {
      console.log("ERROR MYSQL REGISTRO:", err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "DNI o correo ya registrados" });
    }

    const queryInsert = `
      INSERT INTO usuarios (DNI, Nombre, Correo, Contraseña, Direccion, Telefono)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      queryInsert,
      [dni, nombre, correo, contraseña, direccion || null, telefono || null],
      (err) => {
        if (err) {
          console.log("ERROR MYSQL INSERT:", err);
          return res.status(500).json({ error: err.message });
        }

        res.json({ mensaje: "Registro exitoso" });
      }
    );
  });
});

/* =========================
   LOGIN
========================= */
app.post("/api/login", (req, res) => {

  const { correo, contraseña } = req.body;

  if (!correo || !contraseña) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const query = "SELECT * FROM usuarios WHERE Correo = ?";

  connection.query(query, [correo], (err, results) => {
    if (err) {
      console.log("ERROR MYSQL LOGIN:", err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = results[0];
    if (contraseña !== user.Contraseña) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user.IdUsuario, nombre: user.Nombre },
      SECRET_KEY,
      { expiresIn: "24h" }
    );

    res.json({ token, nombre: user.Nombre });
  });
});

/* =========================
   MIDDLEWARE JWT
========================= */
const jwtMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const decoded = jwt.verify(auth.split(" ")[1], SECRET_KEY);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
};

/* =========================
   USUARIO
========================= */
app.get("/api/usuario", jwtMiddleware, (req, res) => {

  const query = "SELECT * FROM usuarios WHERE IdUsuario = ?";

  connection.query(query, [req.user.id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ error: "Error al obtener usuario" });
    }

    res.json(results[0]);
  });
});

app.put("/api/usuario", jwtMiddleware, (req, res) => {

  const { nombre, direccion, telefono } = req.body;

  const query = `
    UPDATE usuarios 
    SET Nombre = ?, Direccion = ?, Telefono = ?
    WHERE IdUsuario = ?
  `;

  connection.query(
    query,
    [nombre, direccion, telefono, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: "Error al actualizar datos" });
      }

      res.json({ mensaje: "Datos actualizados correctamente" });
    }
  );
});

/* =========================
   PRODUCTOS
========================= */
app.get("/productos", (req, res) => {

  const categoriaNombre = req.query.categoria;

  let query = `
    SELECT p.*, 
    GROUP_CONCAT(c.Nombre SEPARATOR ', ') AS Categorias
    FROM Productos p
    LEFT JOIN ProductoCategoria pc ON p.IdProducto = pc.IdProducto
    LEFT JOIN Categorias c ON pc.IdCategoria = c.IdCategoria
  `;

  const params = [];

  if (categoriaNombre) {
    query += `
      WHERE p.IdProducto IN (
        SELECT pc.IdProducto 
        FROM ProductoCategoria pc
        JOIN Categorias c ON pc.IdCategoria = c.IdCategoria
        WHERE c.Nombre = ?
      )
    `;
    params.push(categoriaNombre);
  }

  query += " GROUP BY p.IdProducto";

  connection.query(query, params, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error al obtener productos");
    }

    res.json(results);
  });
});

/* =========================
   CATEGORIAS
========================= */
app.get("/categorias", (req, res) => {
  connection.query("SELECT * FROM Categorias", (err, results) => {
    if (err) {
      return res.status(500).send("Error al obtener categorías");
    }

    res.json(results);
  });
});

const OpenAI = require("openai");

/* =========================
   BUSCAR
========================= */
app.get("/buscar", (req, res) => {

  const termino = req.query.q;

  if (!termino) {
    return res.status(400).json({ error: "Falta el parámetro de búsqueda" });
  }

  const searchTerm = `%${termino}%`;

  const query = `
    SELECT p.*, 
    GROUP_CONCAT(c.Nombre SEPARATOR ', ') AS Categorias
    FROM Productos p
    LEFT JOIN ProductoCategoria pc ON p.IdProducto = pc.IdProducto
    LEFT JOIN Categorias c ON pc.IdCategoria = c.IdCategoria
    WHERE p.Nombre LIKE ? OR p.Tipo LIKE ? OR c.Nombre LIKE ?
    GROUP BY p.IdProducto
  `;

  connection.query(
    query,
    [searchTerm, searchTerm, searchTerm],
    (err, results) => {
      if (err) {
        return res.status(500).send("Error en búsqueda");
      }

      res.json(results);
    }
  );
});

/* =========================
   CHATBOT (deshabilitado)
========================= */
// Se eliminó toda la lógica del chatbot para evitar llamadas a servicios externos.




/* =========================
   SERVER
========================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});