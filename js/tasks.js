const express = require("express");
const router = express.Router();
const db = require("../bd/bd");

// Auth middleware
function auth(req, res, next) {
  if (!req.session?.usuario)
    return res.status(401).json({ error: "Not authenticated" });
  next();
}

router.get("/me", auth, (req, res) => {
  res.json(req.session.usuario);
});

// GET /tasks/tasks - Cambiado 'creada_en' por 'id' ya que no está en tu SQL
router.get("/tasks", auth, (req, res) => {
  db.query(
    "SELECT * FROM tasks WHERE usuario_id = ? ORDER BY id DESC",
    [req.session.usuario.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(rows);
    },
  );
});

// POST /tasks/tasks - Usando 'title', 'description', 'due'
router.post("/tasks", auth, (req, res) => {
  const { title, description, due } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  db.query(
    "INSERT INTO tasks (title, description, due, usuario_id) VALUES (?, ?, ?, ?)",
    [title, description || null, due || null, req.session.usuario.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.status(201).json({
        id: result.insertId,
        title,
        description: description || null,
        due: due || null,
        completed: false,
      });
    },
  );
});

// PATCH /toggle - Usando 'completed'
router.patch("/tasks/:id/toggle", auth, (req, res) => {
  db.query(
    "UPDATE tasks SET completed = NOT completed WHERE id = ? AND usuario_id = ?",
    [req.params.id, req.session.usuario.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ message: "Toggled" });
    },
  );
});

// PUT /tasks/:id - Update completo
router.put("/tasks/:id", auth, (req, res) => {
  const { title, description, due, completed } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });

  db.query(
    "UPDATE tasks SET title=?, description=?, due=?, completed=? WHERE id=? AND usuario_id=?",
    [
      title,
      description || null,
      due || null,
      completed ? 1 : 0,
      req.params.id,
      req.session.usuario.id,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ message: "Updated" });
    },
  );
});

router.delete("/tasks/:id", auth, (req, res) => {
  db.query(
    "DELETE FROM tasks WHERE id = ? AND usuario_id = ?",
    [req.params.id, req.session.usuario.id],
    (err) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ message: "Deleted" });
    },
  );
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logged out" });
  });
});

module.exports = router;
