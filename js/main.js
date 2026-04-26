let allTasks = [];
let currentFilter = "all";
let sortMode = null;

function showError(msg) {
  document.body.innerHTML = `
    <div style="
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      height:100vh; font-family:sans-serif; background:#0f172a; color:#f87171;
      padding:2rem; text-align:center;
    ">
      <div style="font-size:3rem; margin-bottom:1rem;">⚠️</div>
      <div style="font-size:1.2rem; font-weight:bold; margin-bottom:0.5rem;">Algo salió mal</div>
      <div style="font-size:0.95rem; color:#fca5a5; max-width:400px;">${msg}</div>
      <a href="/login" style="
        margin-top:1.5rem; padding:0.6rem 1.4rem; background:#3b82f6;
        color:white; border-radius:8px; text-decoration:none; font-size:0.9rem;
      ">Ir al login</a>
    </div>`;
}

function toast(msg, ms = 2400) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), ms);
}

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function dueMeta(dateStr, completed) {
  if (!dateStr || completed) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr.split("T")[0] + "T00:00:00");
  const diff = Math.round((due - today) / 86400000);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const label =
    diff < 0
      ? `Overdue · ${months[due.getMonth()]} ${due.getDate()}`
      : diff === 0
        ? "Today"
        : diff === 1
          ? "Tomorrow"
          : `${months[due.getMonth()]} ${due.getDate()}`;
  const cls = diff < 0 ? "overdue" : diff === 0 ? "today" : "";
  return { label, cls };
}

async function loadUser() {
  try {
    const res = await fetch("/tasks/me", { credentials: "include" });
    if (!res.ok) {
      showError(
        `No se pudo cargar el usuario (status ${res.status}). ¿Estás autenticado?`,
      );
      return;
    }
    const user = await res.json();
    document.getElementById("user-name").textContent = user.nombre;
    document.getElementById("user-email").textContent = user.email || "";
    document.getElementById("avatar").textContent = initials(user.nombre);
  } catch (e) {
    showError(`Error de red al cargar usuario: ${e.message}`);
  }
}

document.getElementById("btn-logout").addEventListener("click", async () => {
  await fetch("/log-in/logout", { method: "POST", credentials: "include" });
  window.location.href = "/";
});

async function loadTasks() {
  try {
    const res = await fetch("/tasks/tasks", { credentials: "include" });
    if (!res.ok) {
      showError(
        `No se pudieron cargar las tareas (status ${res.status}). ¿Estás autenticado?`,
      );
      return;
    }
    allTasks = await res.json();

    allTasks.forEach((t) => {
      const saved = sessionStorage.getItem("star_" + t.id);
      if (saved !== null) t.destacada = saved === "1";
    });
    render();
  } catch (e) {
    showError(`Error de red al cargar tareas: ${e.message}`);
  }
}

async function addTask() {
  const input = document.getElementById("new-task-input");
  const titulo = input.value.trim();
  if (!titulo) return;
  input.value = "";

  const res = await fetch("/tasks/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ titulo }),
  });
  if (!res.ok) {
    toast("Error creating task");
    return;
  }
  const task = await res.json();
  allTasks.unshift(task);
  render();
  toast("Task added ✓");
}

async function toggleTask(id) {
  const res = await fetch(`/tasks/tasks/${id}/toggle`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) {
    toast("Error");
    return;
  }
  const t = allTasks.find((x) => x.id === id);
  if (t) t.completada = !t.completada;
  render();
}

function toggleStar(id) {
  const t = allTasks.find((x) => x.id === id);
  if (!t) return;
  t.destacada = !t.destacada;
  sessionStorage.setItem("star_" + id, t.destacada ? "1" : "0");

  fetch(`/tasks/tasks/${id}/star`, { method: "PATCH", credentials: "include" });
  render();
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  const res = await fetch(`/tasks/tasks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    toast("Error deleting");
    return;
  }
  allTasks = allTasks.filter((x) => x.id !== id);
  render();
  toast("Task deleted");
}

function openEdit(id) {
  const t = allTasks.find((x) => x.id === id);
  if (!t) return;
  document.getElementById("edit-id").value = t.id;
  document.getElementById("edit-title").value = t.titulo;
  document.getElementById("edit-desc").value = t.descripcion || "";
  document.getElementById("edit-due").value = t.vence
    ? t.vence.split("T")[0]
    : "";
  document.getElementById("modal-overlay").classList.add("open");
}

async function saveEdit() {
  const id = parseInt(document.getElementById("edit-id").value);
  const titulo = document.getElementById("edit-title").value.trim();
  if (!titulo) {
    toast("Title is required");
    return;
  }
  const descripcion = document.getElementById("edit-desc").value.trim();
  const vence = document.getElementById("edit-due").value;
  const t = allTasks.find((x) => x.id === id);

  const res = await fetch(`/tasks/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      titulo,
      descripcion,
      vence,
      completada: t?.completada || false,
    }),
  });
  if (!res.ok) {
    toast("Error saving");
    return;
  }
  if (t) {
    t.titulo = titulo;
    t.descripcion = descripcion;
    t.vence = vence || null;
  }
  closeModal();
  render();
  toast("Saved ✓");
}

function getFiltered() {
  const q = (document.getElementById("search-input").value || "").toLowerCase();
  let list = [...allTasks];

  if (currentFilter === "pending") list = list.filter((t) => !t.completada);
  if (currentFilter === "starred") list = list.filter((t) => t.destacada);
  if (currentFilter === "done") list = list.filter((t) => t.completada);
  if (q) list = list.filter((t) => (t.titulo || "").toLowerCase().includes(q));

  if (sortMode === "date") {
    list.sort((a, b) => {
      if (!a.vence && !b.vence) return 0;
      if (!a.vence) return 1;
      if (!b.vence) return -1;
      return a.vence.localeCompare(b.vence);
    });
  } else if (sortMode === "name") {
    list.sort((a, b) => (a.titulo || "").localeCompare(b.titulo || ""));
  }

  return list;
}

const emptyMessages = {
  all: {
    icon: "📝",
    text: "No tienes tareas aún",
    sub: "Agrega una tarea arriba para empezar",
  },
  pending: { icon: "⏳", text: "Sin tareas pendientes", sub: "¡Todo al día!" },
  starred: {
    icon: "⭐",
    text: "Sin tareas destacadas",
    sub: "Marca una tarea con ★ para verla aquí",
  },
  done: {
    icon: "✅",
    text: "Sin tareas completadas",
    sub: "Completa alguna tarea para verla aquí",
  },
};

function render() {
  const list = getFiltered();
  const container = document.getElementById("tasks-list");

  if (list.length === 0) {
    const em = emptyMessages[currentFilter] || emptyMessages.all;
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${em.icon}</div>
        <div class="empty-text">${em.text}</div>
        <div class="empty-sub">${em.sub}</div>
      </div>`;
  } else {
    container.innerHTML = list
      .map((t) => {
        const due = dueMeta(t.vence, t.completada);
        return `
        <div class="task-row${t.completada ? " done" : ""}">
          <div class="task-check${t.completada ? " checked" : ""}" onclick="toggleTask(${t.id})"></div>
          <div class="task-body">
            <div class="task-title">${esc(t.titulo)}</div>
            ${due ? `<div class="task-due ${due.cls}">${esc(due.label)}</div>` : ""}
          </div>
          <div class="task-actions">
            <button class="task-btn" onclick="openEdit(${t.id})" title="Edit">✏️</button>
            <button class="task-btn delete" onclick="deleteTask(${t.id})" title="Delete">🗑️</button>
            <button class="star-btn${t.destacada ? " starred" : ""}" onclick="toggleStar(${t.id})">★</button>
          </div>
        </div>`;
      })
      .join("");
  }

  document.getElementById("count-all").textContent = allTasks.length;
  document.getElementById("count-pending").textContent = allTasks.filter(
    (t) => !t.completada,
  ).length;
  document.getElementById("count-starred").textContent = allTasks.filter(
    (t) => t.destacada,
  ).length;
  document.getElementById("count-done").textContent = allTasks.filter(
    (t) => t.completada,
  ).length;

  const titles = {
    all: "All tasks",
    pending: "Pending",
    starred: "Starred",
    done: "Completed",
  };
  document.getElementById("header-title").textContent =
    titles[currentFilter] || "All tasks";

  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.filter === currentFilter);
  });
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
}
document.getElementById("btn-cancel").addEventListener("click", closeModal);
document.getElementById("btn-save").addEventListener("click", saveEdit);
document.getElementById("modal-overlay").addEventListener("click", (e) => {
  if (e.target === document.getElementById("modal-overlay")) closeModal();
});

document.querySelectorAll(".nav-item[data-filter]").forEach((el) => {
  el.addEventListener("click", () => {
    currentFilter = el.dataset.filter;
    closeSidebar();
    render();
  });
});

document.getElementById("btn-sort-date").addEventListener("click", function () {
  sortMode = sortMode === "date" ? null : "date";
  this.classList.toggle("active", sortMode === "date");
  document.getElementById("btn-sort-name").classList.remove("active");
  render();
});

document.getElementById("btn-sort-name").addEventListener("click", function () {
  sortMode = sortMode === "name" ? null : "name";
  this.classList.toggle("active", sortMode === "name");
  document.getElementById("btn-sort-date").classList.remove("active");
  render();
});

document.getElementById("search-input").addEventListener("input", render);

document.getElementById("new-task-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});
document.getElementById("btn-add").addEventListener("click", addTask);

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("open");
}

document.getElementById("menu-toggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebar-overlay").classList.toggle("open");
});

document
  .getElementById("sidebar-overlay")
  .addEventListener("click", closeSidebar);

loadUser();
loadTasks();
