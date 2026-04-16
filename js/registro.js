const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const router = express.Router();
const db = require("../bd/bd");

router.post("/usuarios", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)`;
    db.query(sql, [nombre, email, hashedPassword], (err) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send("Error creating user");
      }
      res.send("todobien, usuario creado");
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send("algo paso");
  }
});

module.exports = router;
