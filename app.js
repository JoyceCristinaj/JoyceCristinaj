const STORAGE_KEY = "iin-system-v5";
const SESSION_KEY = "iin-session-v5";
const NUCLEI = ["Campo Grande", "Freguesia", "Jacarezinho", "Penha", "Realengo", "Santa Cruz"];
const SIZES = ["PP", "P", "M", "G", "GG"];
const state = {
  students: [],
  users: [],
  history: [],
  uniformStock: { PP: 20, P: 20, M: 20, G: 20, GG: 20 },
  classDaysByNucleus: createEmptyCalendar(),
  sessionUserId: null,
  search: "",
  attendanceFilter: "todos",
  uniformFilter: "todos",
};
const ui = {
  loginScreen: document.getElementById("loginScreen"),
  appShell: document.getElementById("appShell"),
  loginForm: document.getElementById("loginForm"),
  loginUsername: document.getElementById("loginUsername"),
  loginPassword: document.getElementById("loginPassword"),
  loginMessage: document.getElementById("loginMessage"),
  logoutBtn: document.getElementById("logoutBtn"),
  welcomeTitle: document.getElementById("welcomeTitle"),
  professorArea: document.getElementById("professorArea"),
  professorNucleusBadge: document.getElementById("professorNucleusBadge"),
  professorBoard: document.getElementById("professorBoard"),
  professorUniformBody: document.getElementById("professorUniformBody"),
  professorHistory: document.getElementById("professorHistory"),
  managementArea: document.getElementById("managementArea"),
  totalStudents: document.getElementById("totalStudents"),
  presentCount: document.getElementById("presentCount"),
  absentCount: document.getElementById("absentCount"),
  uniformDelivered: document.getElementById("uniformDelivered"),
  studentForm: document.getElementById("studentForm"),
  studentSchedule: document.getElementById("studentSchedule"),
  classCalendarForm: document.getElementById("classCalendarForm"),
  classCalendarBoard: document.getElementById("classCalendarBoard"),
  calendarStartTimes: Array.from({ length: 6 }, (_, index) => document.getElementById(`calendarStartTime${index + 1}`)),
  calendarEndTimes: Array.from({ length: 6 }, (_, index) => document.getElementById(`calendarEndTime${index + 1}`)),
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
  newRole: document.getElementById("newRole"),
  attendanceCardTemplate: document.getElementById("attendanceCardTemplate"),
};
init();
function init() {
  loadData();
  loadSession();
  hydrateNucleusSelects();
  hydrateStudentScheduleOptions();
  bindEvents();
  render();
}
function hydrateNucleusSelects() {
  const selectIds = [
    "studentNucleus",
    "calendarNucleus",
    "newNucleus",
    "attendanceNucleusFilter",
    "uniformNucleusFilter",
  ];
  selectIds.forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;
    if (id.endsWith("Filter")) {
      select.innerHTML = '<option value="todos">Todos os núcleos</option>';
    } else {
      select.innerHTML = "";
    }
    NUCLEI.forEach((nucleus) => {
      const option = document.createElement("option");
      option.value = nucleus;
      option.textContent = nucleus;
      select.appendChild(option);
    });
  });
}

function hydrateStudentScheduleOptions() {
  if (!ui.studentSchedule) return;

  const nucleus = document.getElementById("studentNucleus")?.value;
  const schedules = state.classDaysByNucleus[nucleus]?.schedules || [];

  ui.studentSchedule.innerHTML = '<option value="">Selecione (opcional)</option>';
  schedules.forEach((slot) => {
    const value = `${slot.start} às ${slot.end}`;
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    ui.studentSchedule.appendChild(option);
  });
}

function bindEvents() {
  ui.loginForm.addEventListener("submit", onLogin);
  ui.logoutBtn.addEventListener("click", onLogout);
  ui.studentForm.addEventListener("submit", onAddStudent);
  document.getElementById("studentNucleus").addEventListener("change", hydrateStudentScheduleOptions);
  ui.classCalendarForm.addEventListener("submit", onAddClassDay);
  ui.attendanceSearch.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderManagementAttendance(currentUser());
  });
  ui.attendanceNucleusFilter.addEventListener("change", (event) => {
    state.attendanceFilter = event.target.value;
    renderManagementAttendance(currentUser());
  });
  ui.uniformNucleusFilter.addEventListener("change", (event) => {
    state.uniformFilter = event.target.value;
    renderManagementUniform(currentUser());
  });
  ui.generateReportBtn.addEventListener("click", () => {
    const period = ui.reportPeriod.value;
    const report = buildReport(period);
    downloadReport(report, period);
    ui.reportStatus.textContent = `Relatório ${period} gerado em ${new Date().toLocaleString("pt-BR")}.`;
  });
  ui.userForm.addEventListener("submit", onCreateUser);
  ui.stockForm.addEventListener("submit", onAdjustStock);
  ui.newRole.addEventListener("change", () => {
    document.getElementById("newNucleus").disabled = ui.newRole.value !== "professor";
  });
}
function createDefaultUsers() {
  return [
    { id: crypto.randomUUID(), username: "prof_cg", password: "prof123", role: "professor", nucleus: "Campo Grande" },
    { id: crypto.randomUUID(), username: "prof_real", password: "prof123", role: "professor", nucleus: "Realengo" },
    { id: crypto.randomUUID(), username: "gestao", password: "iin@2026", role: "gestao", nucleus: null },
    { id: crypto.randomUUID(), username: "admin", password: "admin@2026", role: "admin", nucleus: null },
  ];
}
function ensureRequiredUsers() {
  const required = createDefaultUsers();
  required.forEach((baseUser) => {
    const index = state.users.findIndex((user) => user.username === baseUser.username);
    if (index === -1) {
      state.users.push(baseUser);
      return;
    }
    state.users[index] = {
      ...state.users[index],
      role: baseUser.role,
      nucleus: baseUser.nucleus,
      password: baseUser.password,
    };
  });
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
      classSchedule: "",
    },
    {
      id: crypto.randomUUID(),
      name: "João Pedro",
      nucleus: "Realengo",
      contact: "Responsável: Marta",
      attendance: "falta",
      uniform: { size: "G", delivered: false, notes: "Aguardando" },
      classSchedule: "",
    },
  ];
}
function createEmptyCalendar() {
  return Object.fromEntries(
    NUCLEI.map((nucleus) => [
      nucleus,
      {
        days: [],
        schedules: [],
      },
    ]),
  );
}
function normalizeCalendar(rawCalendar) {
  const normalized = createEmptyCalendar();
  NUCLEI.forEach((nucleus) => {
    const value = rawCalendar?.[nucleus];
    if (Array.isArray(value)) {
      normalized[nucleus].days = [...new Set(value)].sort((a, b) => b.localeCompare(a));
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }
    const days = Array.isArray(value.days) ? value.days : [];
    normalized[nucleus].days = [...new Set(days)].sort((a, b) => b.localeCompare(a));
    if (Array.isArray(value.schedules)) {
      normalized[nucleus].schedules = value.schedules
        .filter((slot) => slot && slot.start && slot.end)
        .slice(0, 6)
        .map((slot) => ({ start: slot.start, end: slot.end }));
      return;
    }
    if (value.schedule?.start && value.schedule?.end) {
      normalized[nucleus].schedules = [{ start: value.schedule.start, end: value.schedule.end }];
    }
  });
  return normalized;
}
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    state.users = createDefaultUsers();
    ensureRequiredUsers();
    state.students = createDefaultStudents();
    state.classDaysByNucleus = createEmptyCalendar();
    persist();
    return;
  }
  try {
    const parsed = JSON.parse(saved);
    state.users = parsed.users || createDefaultUsers();
    ensureRequiredUsers();
    state.students = parsed.students || createDefaultStudents();
    state.history = parsed.history || [];
    state.uniformStock = parsed.uniformStock || state.uniformStock;
    state.classDaysByNucleus = normalizeCalendar(parsed.classDaysByNucleus);
  } catch {
    state.users = createDefaultUsers();
    ensureRequiredUsers();
    state.students = createDefaultStudents();
    state.classDaysByNucleus = createEmptyCalendar();
  }
}
function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      users: state.users,
      students: state.students,
      history: state.history,
      uniformStock: state.uniformStock,
      classDaysByNucleus: state.classDaysByNucleus,
    }),
  );
}
function loadSession() {
  state.sessionUserId = localStorage.getItem(SESSION_KEY);
}
function saveSession() {
  if (state.sessionUserId) {
    localStorage.setItem(SESSION_KEY, state.sessionUserId);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}
function currentUser() {
  return state.users.find((user) => user.id === state.sessionUserId) || null;
}
function onLogin(event) {
  event.preventDefault();
  const username = ui.loginUsername.value.trim();
  const password = ui.loginPassword.value.trim();
  const user = state.users.find((item) => item.username === username && item.password === password);
  if (!user) {
    ui.loginMessage.textContent = "Usuário ou senha inválidos.";
    return;
  }
  state.sessionUserId = user.id;
  saveSession();
  ui.loginForm.reset();
  ui.loginMessage.textContent = `Acesso liberado para ${labelRole(user.role)}.`;
  render();
}
function onLogout() {
  state.sessionUserId = null;
  saveSession();
  ui.loginMessage.textContent = "Sessão encerrada.";
  render();
}
function labelRole(role) {
  if (role === "professor") return "Professor";
  if (role === "gestao") return "Gestão Interna";
  return "Administrador";
}
function render() {
  const user = currentUser();
  ui.loginScreen.classList.toggle("hidden", Boolean(user));
  ui.appShell.classList.toggle("hidden", !user);
  ui.logoutBtn.classList.toggle("hidden", !user);
  if (!user) {
    return;
  }
  const isProfessor = user.role === "professor";
  const isGestao = user.role === "gestao";
  const isAdmin = user.role === "admin";
  ui.welcomeTitle.textContent = `Painel • ${labelRole(user.role)}`;
  ui.professorArea.classList.toggle("hidden", !isProfessor);
  ui.managementArea.classList.toggle("hidden", !(isGestao || isAdmin));
  ui.adminArea.classList.toggle("hidden", !isAdmin);
  if (isProfessor) {
    renderProfessorArea(user);
  }
  if (isGestao || isAdmin) {
    renderManagementArea(user);
  }
  if (isAdmin) {
    renderUsersTable(user);
  }
}
function renderProfessorArea(user) {
  ui.professorNucleusBadge.textContent = `Turma: ${user.nucleus}`;
  const students = state.students.filter((student) => student.nucleus === user.nucleus);
  renderBoard(ui.professorBoard, students, user);
  renderProfessorUniform(students, user);
  renderProfessorHistory(user.nucleus);
}
function renderManagementArea(user) {
  renderMetrics();
  renderClassDays();
  renderManagementAttendance(user);
  renderManagementUniform(user);
  renderStock();
}
function onAddStudent(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;
  const name = document.getElementById("studentName").value.trim();
  const nucleus = document.getElementById("studentNucleus").value;
  const schedule = (ui.studentSchedule?.value || "").trim();
  const contact = document.getElementById("studentContact").value.trim();
  if (!name) return;
  state.students.unshift({
    id: crypto.randomUUID(),
    name,
    nucleus,
    contact,
    attendance: "não registrado",
    uniform: { size: "", delivered: false, notes: "" },
    classSchedule: schedule,
  });
  persist();
  ui.studentForm.reset();
  hydrateStudentScheduleOptions();
  render();
}
function onAddClassDay(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;
  const nucleus = document.getElementById("calendarNucleus").value;
  const date = document.getElementById("calendarDate").value;
  const schedules = getSchedulesFromForm();
  if (!nucleus) return;
  const nucleusData = state.classDaysByNucleus[nucleus] || { days: [], schedules: [] };
  state.classDaysByNucleus[nucleus] = nucleusData;
  let changed = false;
  if (date && !nucleusData.days.includes(date)) {
    nucleusData.days.push(date);
    nucleusData.days.sort((a, b) => b.localeCompare(a));
    changed = true;
  }
  if (schedules.length) {
    nucleusData.schedules = schedules;
    changed = true;
  }
  if (!changed) return;
  persist();
  ui.classCalendarForm.reset();
  renderClassDays();
  hydrateStudentScheduleOptions();
}
function renderBoard(target, students, actor) {
  target.innerHTML = "";
  const effectiveActor = actor || currentUser() || { role: "gestao", nucleus: null, username: "sistema" };
  const nuclei = effectiveActor.role === "professor" ? [effectiveActor.nucleus] : NUCLEI;
  nuclei.forEach((nucleus) => {
    const grouped = students.filter((student) => student.nucleus === nucleus);
    const column = document.createElement("article");
    column.className = "nucleus-column";
    column.innerHTML = `<div class="nucleus-header"><h3>${nucleus}</h3><span class="badge">${grouped.length}</span></div>`;
    if (!grouped.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Sem alunos neste filtro.";
      column.appendChild(empty);
    }
    grouped.forEach((student) => {
      const card = ui.attendanceCardTemplate.content.firstElementChild.cloneNode(true);
      card.querySelector(".student-name").textContent = student.name;
      card.querySelector(".student-contact").textContent = student.contact || "Contato não informado";
      card.querySelector(".student-status").textContent = `Status: ${student.attendance}`;
      card.querySelector(".btn-present").addEventListener("click", () => {
        student.attendance = "presente";
        pushHistory(student, effectiveActor, "chamada", "Marcado como presente");
        persist();
        render();
      });
      card.querySelector(".btn-absent").addEventListener("click", () => {
        student.attendance = "falta";
        pushHistory(student, effectiveActor, "chamada", "Marcado como falta");
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
    ui.professorUniformBody.innerHTML = '<tr><td colspan="5" class="empty">Sem alunos na turma.</td></tr>';
    return;
  }
  students.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.name}</td>
      <td><select data-role="size">${SIZES.map((size) => `<option value="${size}">${size}</option>`).join("")}</select></td>
      <td><select data-role="delivered"><option value="nao">Não entregue</option><option value="sim">Entregue</option></select></td>
      <td><input data-role="notes" type="text" placeholder="Observação" /></td>
      <td><button data-role="save" class="small-btn" type="button">Salvar</button></td>
    `;
    const size = row.querySelector('[data-role="size"]');
    const delivered = row.querySelector('[data-role="delivered"]');
    const notes = row.querySelector('[data-role="notes"]');
    size.value = student.uniform.size || "P";
    delivered.value = student.uniform.delivered ? "sim" : "nao";
    notes.value = student.uniform.notes || "";
    row.querySelector('[data-role="save"]').addEventListener("click", () => {
      applyUniformUpdate(student, size.value, delivered.value === "sim", notes.value.trim(), user);
    });
    ui.professorUniformBody.appendChild(row);
  });
}
function renderProfessorHistory(nucleus) {
  ui.professorHistory.innerHTML = "";
  const entries = state.history.filter((item) => item.nucleus === nucleus).slice(0, 30);
  if (!entries.length) {
    ui.professorHistory.innerHTML = '<li class="empty">Sem histórico da turma.</li>';
    return;
  }
  entries.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${new Date(item.timestamp).toLocaleString("pt-BR")} • ${item.studentName} • ${item.detail}`;
    ui.professorHistory.appendChild(li);
  });
}
function renderMetrics() {
  ui.totalStudents.textContent = state.students.length;
  ui.presentCount.textContent = state.students.filter((student) => student.attendance === "presente").length;
  ui.absentCount.textContent = state.students.filter((student) => student.attendance === "falta").length;
  ui.uniformDelivered.textContent = state.students.filter((student) => student.uniform.delivered).length;
}
function renderClassDays() {
  ui.classCalendarBoard.innerHTML = "";
  NUCLEI.forEach((nucleus) => {
    const nucleusData = state.classDaysByNucleus[nucleus] || { days: [], schedules: [] };
    const days = nucleusData.days || [];
    const card = document.createElement("article");
    card.className = "calendar-card";
    const schedulesLabel = formatSchedules(nucleusData.schedules);
    card.innerHTML = `<div class="calendar-header"><h3>${nucleus}</h3><span class="badge">${days.length} aulas</span></div><p>Horários: ${schedulesLabel}</p>`;
    if (!days.length) {
      card.innerHTML += '<p class="empty">Sem aulas registradas.</p>';
    } else {
      const list = document.createElement("ul");
      list.className = "history-list";
      days.forEach((day) => {
        const li = document.createElement("li");
        li.textContent = new Date(`${day}T00:00:00`).toLocaleDateString("pt-BR");
        list.appendChild(li);
      });
      card.appendChild(list);
    }
    ui.classCalendarBoard.appendChild(card);
  });
}
function renderManagementAttendance(user = currentUser()) {
  const filtered = state.students.filter((student) => {
    const byName = student.name.toLowerCase().includes(state.search);
    const byNucleus = state.attendanceFilter === "todos" || student.nucleus === state.attendanceFilter;
    return byName && byNucleus;
  });
  renderBoard(ui.attendanceBoard, filtered, user);
}
function renderManagementUniform(user = currentUser()) {
  if (!user) return;
  const canDelete = user.role === "admin";
  const students = state.students.filter(
    (student) => state.uniformFilter === "todos" || student.nucleus === state.uniformFilter,
  );
  ui.uniformTableBody.innerHTML = "";
  if (!students.length) {
    ui.uniformTableBody.innerHTML = '<tr><td colspan="7" class="empty">Sem alunos para o filtro.</td></tr>';
    return;
  }
  students.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.name}</td>
      <td>${student.nucleus}</td>
      <td><select data-role="size">${SIZES.map((size) => `<option value="${size}">${size}</option>`).join("")}</select></td>
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
      applyUniformUpdate(student, size.value, delivered.value === "sim", notes.value.trim(), user);
    });
    row.querySelector('[data-role="delete"]').addEventListener("click", () => {
      if (!canDelete) return;
      state.students = state.students.filter((item) => item.id !== student.id);
      persist();
      render();
    });
    ui.uniformTableBody.appendChild(row);
  });
}
function applyUniformUpdate(student, size, delivered, notes, user) {
  const wasDelivered = student.uniform.delivered;
  student.uniform.size = size;
  student.uniform.delivered = delivered;
  student.uniform.notes = notes;
  if (!wasDelivered && delivered) {
    state.uniformStock[size] = Math.max(0, (state.uniformStock[size] || 0) - 1);
  }
  pushHistory(student, user, "uniforme", `Uniforme ${delivered ? "entregue" : "pendente"} (${size})`);
  persist();
  render();
}
function pushHistory(student, user, type, detail) {
  state.history.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    nucleus: student.nucleus,
    studentName: student.name,
    by: user.username,
    type,
    detail,
  });
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
    ui.loginMessage.textContent = "Usuário já existe.";
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
  ui.userForm.reset();
  renderUsersTable(user);
}
function renderUsersTable(user) {
  ui.usersTableBody.innerHTML = "";
  state.users.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.username}</td>
      <td>${labelRole(item.role)}</td>
      <td>${item.nucleus || "-"}</td>
      <td><input data-role="pass" type="password" value="${item.password}" /></td>
      <td>
        <button data-role="reset" class="small-btn" type="button">Resetar</button>
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
      renderUsersTable(user);
    });
    ui.usersTableBody.appendChild(row);
  });
}
function onAdjustStock(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || user.role !== "admin") return;
  const size = document.getElementById("stockSize").value;
  const delta = Number(document.getElementById("stockDelta").value || 0);
  state.uniformStock[size] = Math.max(0, (state.uniformStock[size] || 0) + delta);
  persist();
  render();
}
function getPeriodRange(period) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "anual") {
    return { start: new Date(now.getFullYear(), 0, 1), end, label: "Anual" };
  }
  if (period === "semestral") {
    const startMonth = now.getMonth() < 6 ? 0 : 6;
    return { start: new Date(now.getFullYear(), startMonth, 1), end, label: "Semestral" };
  }
  if (period === "mensal") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end, label: "Mensal" };
  }
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { start, end, label: "Semanal" };
}
function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function formatDateLabel(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("pt-BR");
}
function getSchedulesFromForm() {
  const slots = [];
  for (let index = 0; index < 6; index += 1) {
    const start = ui.calendarStartTimes[index]?.value || "";
    const end = ui.calendarEndTimes[index]?.value || "";
    if (!start || !end) continue;
    slots.push({ start, end });
  }
  return slots;
}
function formatSchedules(schedules = []) {
  if (!Array.isArray(schedules) || !schedules.length) {
    return "não definidos";
  }
  return schedules.map((slot, index) => `${index + 1}) ${slot.start} às ${slot.end}`).join(" • ");
}
function buildReport(period) {
  const { start, end, label } = getPeriodRange(period);
  const startIso = toIsoDate(start);
  const endIso = toIsoDate(end);
  const generatedAt = new Date();
  const lines = [
    "INSTITUTO IRMÃOS NOGUEIRA",
    `RELATÓRIO ${label.toUpperCase()}`,
    `Gerado em: ${generatedAt.toLocaleString("pt-BR")}`,
    `Período: ${start.toLocaleDateString("pt-BR")} até ${end.toLocaleDateString("pt-BR")}`,
    "",
  ];
  NUCLEI.forEach((nucleus) => {
    const students = state.students
      .filter((student) => student.nucleus === nucleus)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const nucleusData = state.classDaysByNucleus[nucleus] || { days: [], schedules: [] };
    const days = (nucleusData.days || []).filter((day) => day >= startIso && day <= endIso);
    lines.push(`TURMA/NÚCLEO: ${nucleus}`);
    lines.push(`Horários da turma: ${formatSchedules(nucleusData.schedules)}`);
    lines.push(`Dias com aula no período: ${days.length ? days.map(formatDateLabel).join(", ") : "nenhum"}`);
    lines.push(`Resumo da turma: ${students.length} alunos | ${students.filter((s) => s.attendance === "presente").length} presentes | ${students.filter((s) => s.attendance === "falta").length} faltas | ${students.filter((s) => s.uniform.delivered).length} uniformes entregues`);
    lines.push("Alunos:");
    if (!students.length) {
      lines.push("- Nenhum aluno cadastrado nesta turma.");
    } else {
      students.forEach((student) => {
        const attendanceDate = generatedAt.toLocaleDateString("pt-BR");
        lines.push(`- Nome completo: ${student.name} | Data do relatório: ${attendanceDate} | Horário matriculado: ${student.classSchedule || "não informado"} | Presença: ${student.attendance} | Uniforme: ${student.uniform.delivered ? "Entregue" : "Pendente"} (${student.uniform.size || "Sem tamanho"})`);
      });
    }
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
