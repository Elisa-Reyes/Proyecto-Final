const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const db = require("../bd/bd");

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM usuarios WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const usuario = results[0];
    const match = await bcrypt.compare(password, usuario.password);

    if (match) {
      req.session.usuario = {
        id: usuario.id,
        nombre: usuario.nombre,
      };
      req.session.save((err) => {
        if (err) return res.status(500).json({ error: "Session error" });
        res.json({ message: "Login correcto" });
      });
    } else {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }
  });
});

module.exports = router;
