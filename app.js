const STORAGE_KEY = "iin-system-v4";
const SESSION_KEY = "iin-session-v4";
const NUCLEI = ["Campo Grande", "Jacarezinho", "Realengo", "Santa Cruz"];
const SIZES = ["PP", "P", "M", "G", "GG"];

const state = {
  students: [],
  classDaysByNucleus: createEmptyClassDays(),
  uniformStock: { PP: 20, P: 20, M: 20, G: 20, GG: 20 },
  history: [],
  users: [],
  sessionUserId: null,
  search: "",
  attendanceFilter: "todos",
  uniformFilter: "todos",
};

const ui = {
  loginForm: document.getElementById("loginForm"),
  loginUsername: document.getElementById("loginUsername"),
  loginPassword: document.getElementById("loginPassword"),
  logoutBtn: document.getElementById("logoutBtn"),
  accessStatus: document.getElementById("accessStatus"),

  professorArea: document.getElementById("professorArea"),
  professorNucleusBadge: document.getElementById("professorNucleusBadge"),
  professorBoard: document.getElementById("professorBoard"),
  professorUniformBody: document.getElementById("professorUniformBody"),
  professorHistory: document.getElementById("professorHistory"),

  managementArea: document.getElementById("managementArea"),
  studentForm: document.getElementById("studentForm"),
  classCalendarForm: document.getElementById("classCalendarForm"),
  classCalendarBoard: document.getElementById("classCalendarBoard"),
  attendanceSearch: document.getElementById("attendanceSearch"),
  attendanceNucleusFilter: document.getElementById("attendanceNucleusFilter"),
  attendanceBoard: document.getElementById("attendanceBoard"),
  uniformNucleusFilter: document.getElementById("uniformNucleusFilter"),
  uniformTableBody: document.getElementById("uniformTableBody"),
  stockView: document.getElementById("stockView"),

  reportPeriod: document.getElementById("reportPeriod"),
  generateReportBtn: document.getElementById("generateReportBtn"),
  reportStatus: document.getElementById("reportStatus"),

  adminArea: document.getElementById("adminArea"),
  userForm: document.getElementById("userForm"),
  usersTableBody: document.getElementById("usersTableBody"),
  stockForm: document.getElementById("stockForm"),

  totalStudents: document.getElementById("totalStudents"),
  presentCount: document.getElementById("presentCount"),
  absentCount: document.getElementById("absentCount"),
  uniformDelivered: document.getElementById("uniformDelivered"),

  attendanceCardTemplate: document.getElementById("attendanceCardTemplate"),
};

loadData();
loadSession();
bindEvents();
render();

function bindEvents() {
  ui.loginForm.addEventListener("submit", onLogin);
  ui.logoutBtn.addEventListener("click", onLogout);

  ui.studentForm.addEventListener("submit", onAddStudent);
  ui.classCalendarForm.addEventListener("submit", onAddClassDay);

  ui.attendanceSearch.addEventListener("input", (e) => {
    state.search = e.target.value.trim().toLowerCase();
    renderManagementAttendance();
  });

  ui.attendanceNucleusFilter.addEventListener("change", (e) => {
    state.attendanceFilter = e.target.value;
    renderManagementAttendance();
  });

  ui.uniformNucleusFilter.addEventListener("change", (e) => {
    state.uniformFilter = e.target.value;
    renderManagementUniform();
  });

  ui.generateReportBtn.addEventListener("click", () => {
    const content = buildReport(ui.reportPeriod.value);
    downloadReport(content, ui.reportPeriod.value);
    ui.reportStatus.textContent = `Relatório ${ui.reportPeriod.value} gerado em ${new Date().toLocaleString("pt-BR")}.`;
  });

  ui.userForm.addEventListener("submit", onCreateUser);
  ui.stockForm.addEventListener("submit", onAdjustStockByAdmin);
}

function createDefaultUsers() {
  return [
    { id: crypto.randomUUID(), username: "prof_cg", password: "prof123", role: "professor", nucleus: "Campo Grande" },
    { id: crypto.randomUUID(), username: "prof_real", password: "prof123", role: "professor", nucleus: "Realengo" },
    { id: crypto.randomUUID(), username: "gestao", password: "iin@2026", role: "gestao", nucleus: null },
    { id: crypto.randomUUID(), username: "admin", password: "admin@2026", role: "admin", nucleus: null },
  ];
}

function createDefaultStudents() {
  return [
    {
      id: crypto.randomUUID(),
      name: "Ana Beatriz",
      nucleus: "Campo Grande",
      contact: "Responsável: Carlos",
      attendance: "presente",
      uniform: { size: "M", delivered: true, notes: "Entregue" },
    },
    {
      id: crypto.randomUUID(),
      name: "João Pedro",
      nucleus: "Realengo",
      contact: "Responsável: Marta",
      attendance: "falta",
      uniform: { size: "G", delivered: false, notes: "Aguardando" },
    },
  ];
}

function createEmptyClassDays() {
  return { "Campo Grande": [], Jacarezinho: [], Realengo: [], "Santa Cruz": [] };
}

function createHistoryEntry({ type, student, byUser, detail }) {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    nucleus: student.nucleus,
    studentName: student.name,
    by: byUser.username,
    type,
    detail,
  };
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    state.students = createDefaultStudents();
    state.users = createDefaultUsers();
    state.classDaysByNucleus = {
      "Campo Grande": ["2026-02-11"],
      Jacarezinho: ["2026-02-10"],
      Realengo: ["2026-02-09"],
      "Santa Cruz": [],
    };
    state.history = [];
    persist();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state.students = parsed.students || [];
    state.users = parsed.users || createDefaultUsers();
    state.classDaysByNucleus = parsed.classDaysByNucleus || createEmptyClassDays();
    state.uniformStock = parsed.uniformStock || state.uniformStock;
    state.history = parsed.history || [];
  } catch {
    state.students = createDefaultStudents();
    state.users = createDefaultUsers();
    state.classDaysByNucleus = createEmptyClassDays();
    state.history = [];
  }
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      students: state.students,
      classDaysByNucleus: state.classDaysByNucleus,
      uniformStock: state.uniformStock,
      history: state.history,
      users: state.users,
    }),
  );
}

function loadSession() {
  state.sessionUserId = localStorage.getItem(SESSION_KEY);
}

function saveSession() {
  if (!state.sessionUserId) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, state.sessionUserId);
}

function currentUser() {
  return state.users.find((user) => user.id === state.sessionUserId) || null;
}

function onLogin(event) {
  event.preventDefault();
  const username = ui.loginUsername.value.trim();
  const password = ui.loginPassword.value;
  const user = state.users.find((item) => item.username === username && item.password === password);

  if (!user) {
    ui.accessStatus.textContent = "Usuário ou senha inválidos.";
    return;
  }

  state.sessionUserId = user.id;
  saveSession();
  ui.loginForm.reset();
  ui.accessStatus.textContent = `Login realizado com sucesso no perfil ${labelRole(user.role)}.`;
  render();
}

function onLogout() {
  state.sessionUserId = null;
  saveSession();
  ui.accessStatus.textContent = "Sessão encerrada.";
  render();
}

function labelRole(role) {
  if (role === "professor") return "Professor";
  if (role === "gestao") return "Gestão Interna";
  return "Administrador";
}

function onAddStudent(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const name = document.getElementById("studentName").value.trim();
  const nucleus = document.getElementById("studentNucleus").value;
  const contact = document.getElementById("studentContact").value.trim();

  if (!name) return;

  state.students.unshift({
    id: crypto.randomUUID(),
    name,
    nucleus,
    contact,
    attendance: "não registrado",
    uniform: { size: "", delivered: false, notes: "" },
  });

  persist();
  render();
  ui.studentForm.reset();
}

function onAddClassDay(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const nucleus = document.getElementById("calendarNucleus").value;
  const date = document.getElementById("calendarDate").value;
  if (!nucleus || !date) return;

  if (!state.classDaysByNucleus[nucleus].includes(date)) {
    state.classDaysByNucleus[nucleus].push(date);
    state.classDaysByNucleus[nucleus].sort((a, b) => b.localeCompare(a));
    persist();
    renderClassDays();
  }
}

function render() {
  const user = currentUser();
  const isProfessor = user?.role === "professor";
  const isGestao = user?.role === "gestao";
  const isAdmin = user?.role === "admin";

  ui.logoutBtn.classList.toggle("hidden", !user);
  ui.professorArea.classList.toggle("hidden", !isProfessor);
  ui.managementArea.classList.toggle("hidden", !(isGestao || isAdmin));
  ui.adminArea.classList.toggle("hidden", !isAdmin);

  if (isProfessor) {
    ui.professorNucleusBadge.textContent = `Turma: ${user.nucleus}`;
    renderProfessorArea(user);
  }

  if (isGestao || isAdmin) {
    renderMetrics();
    renderClassDays();
    renderManagementAttendance();
    renderManagementUniform();
    renderStock();
  }

  if (isAdmin) {
    renderUsersTable();
  }
}

function renderProfessorArea(user) {
  const students = state.students.filter((student) => student.nucleus === user.nucleus);
  renderBoard(ui.professorBoard, students, user);
  renderProfessorUniform(students, user);
  renderProfessorHistory(user.nucleus);
}

function renderBoard(target, students, actor) {
  target.innerHTML = "";

  const grouped = {};
  NUCLEI.forEach((nucleus) => {
    grouped[nucleus] = students.filter((student) => student.nucleus === nucleus);
  });

  const visibleNuclei = actor.role === "professor" ? [actor.nucleus] : NUCLEI;

  visibleNuclei.forEach((nucleus) => {
    const column = document.createElement("article");
    column.className = "nucleus-column";
    const list = grouped[nucleus];

    column.innerHTML = `
      <div class="nucleus-header"><h3>${nucleus}</h3><span class="badge">${list.length}</span></div>
    `;

    if (list.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Sem alunos neste filtro.";
      column.appendChild(empty);
    }

    list.forEach((student) => {
      const card = ui.attendanceCardTemplate.content.firstElementChild.cloneNode(true);
      card.querySelector(".student-name").textContent = student.name;
      card.querySelector(".student-contact").textContent = student.contact || "Contato não informado";
      card.querySelector(".student-status").textContent = `Status: ${student.attendance}`;

      card.querySelector(".btn-present").addEventListener("click", () => {
        student.attendance = "presente";
        state.history.unshift(
          createHistoryEntry({ type: "chamada", student, byUser: actor, detail: "Marcado como presente" }),
        );
        persist();
        render();
      });

      card.querySelector(".btn-absent").addEventListener("click", () => {
        student.attendance = "falta";
        state.history.unshift(
          createHistoryEntry({ type: "chamada", student, byUser: actor, detail: "Marcado como falta" }),
        );
        persist();
        render();
      });

      column.appendChild(card);
    });

    target.appendChild(column);
  });
}

function renderProfessorUniform(students, user) {
  ui.professorUniformBody.innerHTML = "";

  if (!students.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="5" class="empty">Sem alunos na turma.</td>';
    ui.professorUniformBody.appendChild(row);
    return;
  }

  students.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.name}</td>
      <td>
        <select data-role="size">${SIZES.map((size) => `<option value="${size}">${size}</option>`).join("")}</select>
      </td>
      <td>
        <select data-role="delivered"><option value="nao">Não entregue</option><option value="sim">Entregue</option></select>
      </td>
      <td><input data-role="notes" type="text" placeholder="Observação" /></td>
      <td><button class="small-btn" data-role="save" type="button">Salvar</button></td>
    `;

    const size = row.querySelector('[data-role="size"]');
    const delivered = row.querySelector('[data-role="delivered"]');
    const notes = row.querySelector('[data-role="notes"]');
    size.value = student.uniform.size || "P";
    delivered.value = student.uniform.delivered ? "sim" : "nao";
    notes.value = student.uniform.notes || "";

    row.querySelector('[data-role="save"]').addEventListener("click", () => {
      const prevDelivered = student.uniform.delivered;
      student.uniform.size = size.value;
      student.uniform.delivered = delivered.value === "sim";
      student.uniform.notes = notes.value.trim();

      if (!prevDelivered && student.uniform.delivered) {
        state.uniformStock[student.uniform.size] = Math.max(0, (state.uniformStock[student.uniform.size] || 0) - 1);
      }

      state.history.unshift(
        createHistoryEntry({
          type: "uniforme",
          student,
          byUser: user,
          detail: `Uniforme ${student.uniform.delivered ? "entregue" : "pendente"} (${student.uniform.size})`,
        }),
      );
      persist();
      render();
    });

    ui.professorUniformBody.appendChild(row);
  });
}

function renderProfessorHistory(nucleus) {
  ui.professorHistory.innerHTML = "";
  const history = state.history.filter((item) => item.nucleus === nucleus).slice(0, 25);

  if (!history.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Sem histórico da turma.";
    ui.professorHistory.appendChild(li);
    return;
  }

  history.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${new Date(item.timestamp).toLocaleString("pt-BR")} • ${item.studentName} • ${item.detail}`;
    ui.professorHistory.appendChild(li);
  });
}

function renderMetrics() {
  ui.totalStudents.textContent = state.students.length;
  ui.presentCount.textContent = state.students.filter((s) => s.attendance === "presente").length;
  ui.absentCount.textContent = state.students.filter((s) => s.attendance === "falta").length;
  ui.uniformDelivered.textContent = state.students.filter((s) => s.uniform.delivered).length;
}

function renderClassDays() {
  ui.classCalendarBoard.innerHTML = "";
  NUCLEI.forEach((nucleus) => {
    const card = document.createElement("article");
    card.className = "calendar-card";
    const days = state.classDaysByNucleus[nucleus] || [];

    card.innerHTML = `<div class="calendar-header"><h3>${nucleus}</h3><span class="badge">${days.length} aulas</span></div>`;

    const ul = document.createElement("ul");
    ul.className = "history-list";

    days.forEach((day) => {
      const li = document.createElement("li");
      li.textContent = new Date(`${day}T00:00:00`).toLocaleDateString("pt-BR");
      ul.appendChild(li);
    });

    if (!days.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Sem aulas registradas.";
      card.appendChild(empty);
    } else {
      card.appendChild(ul);
    }

    ui.classCalendarBoard.appendChild(card);
  });
}

function renderManagementAttendance() {
  const filtered = state.students.filter((student) => {
    const byName = student.name.toLowerCase().includes(state.search);
    const byNucleus = state.attendanceFilter === "todos" || student.nucleus === state.attendanceFilter;
    return byName && byNucleus;
  });

  const actor = currentUser();
  renderBoard(ui.attendanceBoard, filtered, actor || { role: "gestao" });
}

function renderManagementUniform() {
  const user = currentUser();
  const canDelete = user?.role === "admin";
  const students = state.students.filter(
    (student) => state.uniformFilter === "todos" || student.nucleus === state.uniformFilter,
  );

  ui.uniformTableBody.innerHTML = "";

  students.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.name}</td>
      <td>${student.nucleus}</td>
      <td><select data-role="size"><option>PP</option><option>P</option><option>M</option><option>G</option><option>GG</option></select></td>
      <td><select data-role="delivered"><option value="nao">Não entregue</option><option value="sim">Entregue</option></select></td>
      <td><input data-role="notes" type="text" placeholder="Obs" /></td>
      <td><button data-role="save" class="small-btn" type="button">Salvar</button></td>
      <td><button data-role="delete" class="ghost" type="button" ${canDelete ? "" : "disabled"}>Excluir</button></td>
    `;

    const size = row.querySelector('[data-role="size"]');
    const delivered = row.querySelector('[data-role="delivered"]');
    const notes = row.querySelector('[data-role="notes"]');

    size.value = student.uniform.size || "P";
    delivered.value = student.uniform.delivered ? "sim" : "nao";
    notes.value = student.uniform.notes || "";

    row.querySelector('[data-role="save"]').addEventListener("click", () => {
      const prevDelivered = student.uniform.delivered;
      student.uniform.size = size.value;
      student.uniform.delivered = delivered.value === "sim";
      student.uniform.notes = notes.value.trim();

      if (!prevDelivered && student.uniform.delivered) {
        state.uniformStock[student.uniform.size] = Math.max(0, (state.uniformStock[student.uniform.size] || 0) - 1);
      }

      persist();
      render();
    });

    row.querySelector('[data-role="delete"]').addEventListener("click", () => {
      if (!canDelete) return;
      state.students = state.students.filter((item) => item.id !== student.id);
      persist();
      render();
    });

    ui.uniformTableBody.appendChild(row);
  });

  if (!students.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="7" class="empty">Sem alunos para o filtro.</td>';
    ui.uniformTableBody.appendChild(row);
  }
}

function renderStock() {
  ui.stockView.innerHTML = "";
  SIZES.forEach((size) => {
    const card = document.createElement("article");
    card.className = "stock-card";
    card.innerHTML = `<h4>${size}</h4><p>${state.uniformStock[size] || 0} unidades</p>`;
    ui.stockView.appendChild(card);
  });
}

function onCreateUser(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || user.role !== "admin") return;

  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value;
  const role = document.getElementById("newRole").value;
  const nucleus = document.getElementById("newNucleus").value;

  if (!username || !password) return;
  if (state.users.some((item) => item.username === username)) {
    ui.accessStatus.textContent = "Já existe usuário com esse login.";
    return;
  }

  state.users.push({
    id: crypto.randomUUID(),
    username,
    password,
    role,
    nucleus: role === "professor" ? nucleus : null,
  });

  persist();
  renderUsersTable();
  ui.userForm.reset();
}

function renderUsersTable() {
  const user = currentUser();
  if (!user || user.role !== "admin") return;

  ui.usersTableBody.innerHTML = "";

  state.users.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.username}</td>
      <td>${labelRole(item.role)}</td>
      <td>${item.nucleus || "-"}</td>
      <td><input data-role="pass" type="password" value="${item.password}" /></td>
      <td>
        <button data-role="reset" class="small-btn" type="button">Resetar senha</button>
        <button data-role="delete" class="ghost" type="button" ${item.id === user.id ? "disabled" : ""}>Excluir</button>
      </td>
    `;

    row.querySelector('[data-role="reset"]').addEventListener("click", () => {
      const newPass = row.querySelector('[data-role="pass"]').value;
      item.password = newPass;
      persist();
    });

    row.querySelector('[data-role="delete"]').addEventListener("click", () => {
      if (item.id === user.id) return;
      state.users = state.users.filter((u) => u.id !== item.id);
      persist();
      renderUsersTable();
    });

    ui.usersTableBody.appendChild(row);
  });
}

function onAdjustStockByAdmin(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || user.role !== "admin") return;

  const size = document.getElementById("stockSize").value;
  const delta = Number(document.getElementById("stockDelta").value || 0);
  state.uniformStock[size] = Math.max(0, (state.uniformStock[size] || 0) + delta);
  persist();
  renderStock();
}

function getPeriodRange(period) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "mensal") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end, label: "Mensal" };
  }

  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { start, end, label: "Semanal" };
}

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildReport(period) {
  const { start, end, label } = getPeriodRange(period);
  const startIso = toIsoDate(start);
  const endIso = toIsoDate(end);

  const lines = [
    "INSTITUTO IRMÃOS NOGUEIRA",
    `RELATÓRIO ${label.toUpperCase()}`,
    `Período: ${start.toLocaleDateString("pt-BR")} até ${end.toLocaleDateString("pt-BR")}`,
    "",
  ];

  NUCLEI.forEach((nucleus) => {
    const students = state.students.filter((s) => s.nucleus === nucleus);
    const days = (state.classDaysByNucleus[nucleus] || []).filter((d) => d >= startIso && d <= endIso);
    lines.push(`${nucleus}`);
    lines.push(`- Alunos: ${students.length}`);
    lines.push(`- Presenças: ${students.filter((s) => s.attendance === "presente").length}`);
    lines.push(`- Faltas: ${students.filter((s) => s.attendance === "falta").length}`);
    lines.push(`- Uniformes entregues: ${students.filter((s) => s.uniform.delivered).length}`);
    lines.push(`- Dias com aula no período: ${days.length ? days.join(", ") : "nenhum"}`);
    lines.push("");
  });

  return lines.join("\n");
}

function downloadReport(content, period) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `relatorio-${period}-${toIsoDate(new Date())}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
