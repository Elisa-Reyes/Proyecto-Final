let allTasks = [];
let currentFilter = "all";

// --- UTILIDADES ---
const esc = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const toast = (msg) => {
  const el = document.getElementById("toast");
  if (el) {
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2400);
  }
};

function formatDue(dateStr, completed) {
  if (!dateStr || completed) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr.split("T")[0] + "T00:00:00");
  const diff = Math.round((due - today) / 86400000);

  if (diff < 0) return { label: "Vencida", cls: "overdue" };
  if (diff === 0) return { label: "Hoy", cls: "today" };
  return { label: `${due.getDate()}/${due.getMonth() + 1}`, cls: "" };
}

function updateCounts() {
  const countAll = document.getElementById("count-all");
  const countPending = document.getElementById("count-pending");
  const countDone = document.getElementById("count-done");

  if (countAll) countAll.textContent = allTasks.length;
  if (countPending)
    countPending.textContent = allTasks.filter((t) => !t.completed).length;
  if (countDone)
    countDone.textContent = allTasks.filter((t) => t.completed).length;
}

// --- CARGA DE DATOS ---
async function loadAll() {
  try {
    const [uRes, tRes] = await Promise.all([
      fetch("/tasks/me", { credentials: "include" }),
      fetch("/tasks/tasks", { credentials: "include" }),
    ]);
    if (uRes.ok) {
      const user = await uRes.json();
      document.getElementById("user-name").textContent = user.nombre;
      document.getElementById("avatar").textContent = user.nombre
        .charAt(0)
        .toUpperCase();
    }
    if (tRes.ok) {
      allTasks = await tRes.json();
      render();
    }
  } catch (e) {
    console.error("Error cargando datos:", e);
  }
}

// --- RENDERIZADO CORREGIDO ---
function render() {
  const container = document.getElementById("tasks-list");
  if (!container) return;

  const searchInput = document.getElementById("search-input");
  const searchQuery = searchInput ? searchInput.value.toLowerCase() : "";

  const filtered = allTasks.filter((t) => {
    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "pending" && !t.completed) ||
      (currentFilter === "done" && t.completed);

    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery) ||
      (t.description && t.description.toLowerCase().includes(searchQuery));

    return matchesFilter && matchesSearch;
  });

  container.innerHTML = filtered.length
    ? filtered
        .map((t) => {
          const due = formatDue(t.due, t.completed);
          return `
        <div class="task-row ${t.completed ? "done" : ""}">
            <div class="task-check ${t.completed ? "checked" : ""}" onclick="toggleTask(${t.id})"></div>
            <div class="task-body">
                <div class="task-title">${esc(t.title)}</div>
                ${due ? `<div class="task-due ${due.cls}">${due.label}</div>` : ""}
            </div>
            <div class="task-actions">
                <button onclick="openEdit(${t.id})" class="task-btn">✏️</button>
                <button onclick="deleteTask(${t.id})" class="task-btn delete">🗑️</button>
            </div>
        </div>`;
        })
        .join("")
    : `<div class="empty-state">No se encontraron tareas</div>`;

  updateCounts();
}

// --- ACCIONES ---
window.toggleTask = async (id) => {
  const res = await fetch(`/tasks/tasks/${id}/toggle`, {
    method: "PATCH",
    credentials: "include",
  });
  if (res.ok) {
    const t = allTasks.find((x) => x.id === id);
    if (t) t.completed = !t.completed;
    render();
  }
};

window.deleteTask = async (id) => {
  if (!confirm("Erase task?")) return;
  const res = await fetch(`/tasks/tasks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (res.ok) {
    allTasks = allTasks.filter((x) => x.id !== id);
    render();
  }
};

window.openEdit = (id) => {
  const t = allTasks.find((x) => x.id === id);
  if (!t) return;
  document.getElementById("edit-id").value = t.id;
  document.getElementById("edit-title").value = t.title;
  document.getElementById("edit-desc").value = t.description || "";
  document.getElementById("edit-due").value = t.due ? t.due.split("T")[0] : "";
  document.getElementById("modal-overlay").classList.add("open");
};

// --- EVENTOS ---
document.addEventListener("DOMContentLoaded", () => {
  loadAll();

  const btnAdd = document.getElementById("btn-add");
  const inputAdd = document.getElementById("new-task-input");

  // Logout
  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.onclick = async (e) => {
      e.preventDefault();
      await fetch("/log-in/logout", { method: "POST", credentials: "include" });
      window.location.href = "/login";
    };
  }

  // Búsqueda en tiempo real
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", render);
  }

  // Agregar Tarea
  const addTask = async () => {
    const val = inputAdd.value.trim();
    if (!val) return;
    const res = await fetch("/tasks/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: val }),
    });
    if (res.ok) {
      const newTask = await res.json();
      allTasks.unshift(newTask);
      inputAdd.value = "";
      render();
    }
  };

  if (btnAdd) {
    btnAdd.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      addTask();
    });
  }
  inputAdd.onkeydown = (e) => {
    if (e.key === "Enter") addTask();
  };

  // Guardar Edición
  document.getElementById("btn-save").onclick = async () => {
    const id = document.getElementById("edit-id").value;
    const t = allTasks.find((x) => x.id == id);
    const payload = {
      title: document.getElementById("edit-title").value,
      description: document.getElementById("edit-desc").value,
      due: document.getElementById("edit-due").value || null,
      completed: t ? t.completed : false,
    };
    const res = await fetch(`/tasks/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      if (t) Object.assign(t, payload);
      document.getElementById("modal-overlay").classList.remove("open");
      render();
    }
  };

  // UI (Menú y Modal)
  document.getElementById("menu-toggle").onclick = () => {
    document.getElementById("sidebar").classList.toggle("open");
    document.getElementById("sidebar-overlay").classList.toggle("open");
  };

  document.getElementById("btn-cancel").onclick = () => {
    document.getElementById("modal-overlay").classList.remove("open");
  };

  // Filtros de navegación
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.onclick = () => {
      currentFilter = el.dataset.filter;
      // Resaltar el item activo visualmente (opcional)
      document
        .querySelectorAll(".nav-item")
        .forEach((nav) => nav.classList.remove("active"));
      el.classList.add("active");

      render();
      document.getElementById("sidebar").classList.remove("open");
      document.getElementById("sidebar-overlay").classList.remove("open");
    };
  });
});
