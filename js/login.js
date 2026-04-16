const bcrypt = require("bcrypt");
const session = require("express-session");
const express = require("express");
const router = express.Router();
const db = require("../bd/bd");

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM usuarios WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (results.length === 0) {
      return res.status(401).send("Usuario no encontrado");
    }
    const usuario = results[0];
    const match = await bcrypt.compare(password, usuario.password);
    if (match) {
      req.session.usuario = {
        id: usuario.id,
        nombre: usuario.nombre,
      };
      res.send("Login correcto");
      console.log("ok si");
    } else {
      res.status(401).send("Contraseña incorrecta");
    }
  });
});

module.exports = router;
