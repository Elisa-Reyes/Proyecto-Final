const express = require("express");
const router = express.Router();
const db = require("../bd/bd");

// Auth middleware
function auth(req, res, next) {
  if (!req.session?.usuario)
    return res.status(401).json({ error: "Not authenticated" });
  next();
}

// GET /tasks/me
router.get("/me", auth, (req, res) => {
  res.json(req.session.usuario);
});

// GET /tasks/tasks
router.get("/tasks", auth, (req, res) => {
  db.query(
    "SELECT * FROM tasks WHERE usuario_id = ? ORDER BY creada_en DESC",
    [req.session.usuario.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(rows);
    },
  );
});

// POST /tasks/tasks
router.post("/tasks", auth, (req, res) => {
  const { titulo, descripcion, vence } = req.body;
  if (!titulo) return res.status(400).json({ error: "Title is required" });

  db.query(
    "INSERT INTO tasks (titulo, descripcion, vence, usuario_id) VALUES (?, ?, ?, ?)",
    [titulo, descripcion || null, vence || null, req.session.usuario.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.status(201).json({
        id: result.insertId,
        titulo,
        descripcion: descripcion || null,
        vence: vence || null,
        completada: false,
        destacada: false,
      });
    },
  );
});

// PATCH /tasks/tasks/:id/toggle  — toggle completed
router.patch("/tasks/:id/toggle", auth, (req, res) => {
  db.query(
    "UPDATE tasks SET completada = NOT completada WHERE id = ? AND usuario_id = ?",
    [req.params.id, req.session.usuario.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Task not found" });
      res.json({ message: "Toggled" });
    },
  );
});

// PATCH /tasks/tasks/:id/star  — toggle starred
router.patch("/tasks/:id/star", auth, (req, res) => {
  db.query(
    "UPDATE tasks SET destacada = NOT destacada WHERE id = ? AND usuario_id = ?",
    [req.params.id, req.session.usuario.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Task not found" });
      res.json({ message: "Star toggled" });
    },
  );
});

// PUT /tasks/tasks/:id  — full update
router.put("/tasks/:id", auth, (req, res) => {
  const { titulo, descripcion, vence, completada } = req.body;
  if (!titulo) return res.status(400).json({ error: "Title required" });

  db.query(
    "UPDATE tasks SET titulo=?, descripcion=?, vence=?, completada=? WHERE id=? AND usuario_id=?",
    [
      titulo,
      descripcion || null,
      vence || null,
      completada ? 1 : 0,
      req.params.id,
      req.session.usuario.id,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Task not found" });
      res.json({ message: "Updated" });
    },
  );
});

// DELETE /tasks/tasks/:id
router.delete("/tasks/:id", auth, (req, res) => {
  db.query(
    "DELETE FROM tasks WHERE id = ? AND usuario_id = ?",
    [req.params.id, req.session.usuario.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Task not found" });
      res.json({ message: "Deleted" });
    },
  );
});

module.exports = router;
