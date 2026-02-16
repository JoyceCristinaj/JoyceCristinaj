const STORAGE_KEY = "iin-system-v5";
const SESSION_KEY = "iin-session-v5";
const NUCLEI = ["Campo Grande", "Freguesia", "Jacarezinho", "Penha", "Realengo", "Santa Cruz", "Macaé"];
const STOCK_CATEGORIES = [
  { key: "camiseta", label: "Camiseta" },
  { key: "shorts", label: "Shorts" },
  { key: "kimono", label: "Kimono" },
  { key: "bandagem", label: "Bandagem" },
  { key: "protetor_bucal", label: "Protetor bucal" },
];
const PROJECT_NUCLEI = {
  light: ["Campo Grande", "Jacarezinho", "Penha", "Santa Cruz"],
  enel: ["Macaé"],
  supergasbras: ["Freguesia", "Realengo"],
};
const PROJECTS = [
  { key: "light", label: "Light", processNumber: "A definir" },
  { key: "enel", label: "Enel", processNumber: "A definir" },
  { key: "supergasbras", label: "Supergasbras", processNumber: "A definir" },
];
const PROJECT_MODALITIES = {
  light: ["Boxe", "Muay Thai", "Jiu Jitso"],
  enel: ["Jiu Jitso", "Muay Thai"],
  supergasbras: ["Boxe", "Jiu Jitso"],
};
const MODALITY_ITEMS = {
  "Jiu Jitso": ["camiseta", "kimono"],
  Boxe: ["camiseta", "shorts", "bandagem", "protetor_bucal"],
  "Muay Thai": ["camiseta", "shorts", "bandagem", "protetor_bucal"],
};
const state = {
  students: [],
  users: [],
  history: [],
  uniformStockByProject: createUniformStockByProject(),
  classDaysByProject: createProjectCalendars(),
  attendanceStaffByProject: createAttendanceStaffByProject(),
  sessionUserId: null,
  currentProjectKey: PROJECTS[0].key,
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
  loginProject: document.getElementById("loginProject"),
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
  studentModality: document.getElementById("studentModality"),
  classCalendarForm: document.getElementById("classCalendarForm"),
  classCalendarBoard: document.getElementById("classCalendarBoard"),
  calendarStartTimes: Array.from({ length: 6 }, (_, index) => document.getElementById(`calendarStartTime${index + 1}`)),
  calendarEndTimes: Array.from({ length: 6 }, (_, index) => document.getElementById(`calendarEndTime${index + 1}`)),
  attendanceSearch: document.getElementById("attendanceSearch"),
  attendanceNucleusFilter: document.getElementById("attendanceNucleusFilter"),
  attendanceReportBoard: document.getElementById("attendanceReportBoard"),
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
  professorClassDate: document.getElementById("professorClassDate"),
  professorClassSchedule: document.getElementById("professorClassSchedule"),
  professorClassProfessorName: document.getElementById("professorClassProfessorName"),
  professorClassMonitorName: document.getElementById("professorClassMonitorName"),
  professorClassSave: document.getElementById("professorClassSave"),
  professorClassStatus: document.getElementById("professorClassStatus"),
  attendanceClassDate: document.getElementById("attendanceClassDate"),
  attendanceClassSchedule: document.getElementById("attendanceClassSchedule"),
  attendanceClassProfessorName: document.getElementById("attendanceClassProfessorName"),
  attendanceClassMonitorName: document.getElementById("attendanceClassMonitorName"),
  attendanceClassSave: document.getElementById("attendanceClassSave"),
  attendanceClassStatus: document.getElementById("attendanceClassStatus"),
  professorHistoryDate: document.getElementById("professorHistoryDate"),
};
init();
function init() {
  loadData();
  loadSession();
  hydrateNucleusSelects();
  hydrateProjectSelects();
  hydrateStudentScheduleOptions();
  hydrateStudentModalityOptions();
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
  const visibleNuclei = getVisibleNuclei();

  selectIds.forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;

    if (id.endsWith("Filter")) {
      select.innerHTML = '<option value="todos">Todos os núcleos</option>';
    } else {
      select.innerHTML = "";
    }

    visibleNuclei.forEach((nucleus) => {
      const option = document.createElement("option");
      option.value = nucleus;
      option.textContent = nucleus;
      select.appendChild(option);
    });

    if (!id.endsWith("Filter") && visibleNuclei.length) {
      select.value = visibleNuclei[0];
    }
  });
}

function hydrateStudentScheduleOptions() {
  if (!ui.studentSchedule) return;

  const nucleus = document.getElementById("studentNucleus")?.value;
  const projectCalendar = getProjectCalendar();
  const schedules = projectCalendar[nucleus]?.schedules || [];

  ui.studentSchedule.innerHTML = '<option value="">Selecione (opcional)</option>';
  schedules.forEach((slot) => {
    const value = `${slot.start} às ${slot.end}`;
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    ui.studentSchedule.appendChild(option);
  });
}


function hydrateStudentModalityOptions() {
  if (!ui.studentModality) return;

  const modalities = PROJECT_MODALITIES[state.currentProjectKey] || [];
  ui.studentModality.innerHTML = "";
  modalities.forEach((modality) => {
    const option = document.createElement("option");
    option.value = modality;
    option.textContent = modality;
    ui.studentModality.appendChild(option);
  });
}

function getAllowedItemsByModality(modality) {
  return MODALITY_ITEMS[modality] || [];
}

function labelStockCategory(categoryKey) {
  return STOCK_CATEGORIES.find((item) => item.key === categoryKey)?.label || categoryKey;
}

function formatAllowedItems(modality) {
  const items = getAllowedItemsByModality(modality);
  return items.length ? items.map(labelStockCategory).join(", ") : "Sem itens configurados";
}

function createEmptyDeliveryItems() {
  return Object.fromEntries(STOCK_CATEGORIES.map((item) => [item.key, false]));
}

function normalizeDeliveryItems(student) {
  const allowedItems = getAllowedItemsByModality(student.modality);
  const emptyItems = createEmptyDeliveryItems();
  const savedItems = student.uniform?.items || {};

  if (student.uniform?.delivered === true) {
    allowedItems.forEach((itemKey) => {
      emptyItems[itemKey] = true;
    });
  }

  allowedItems.forEach((itemKey) => {
    if (typeof savedItems[itemKey] === "boolean") {
      emptyItems[itemKey] = savedItems[itemKey];
    }
  });

  return emptyItems;
}

function isKitDelivered(student) {
  const allowedItems = getAllowedItemsByModality(student.modality);
  if (!allowedItems.length) return false;
  return allowedItems.every((itemKey) => student.uniform?.items?.[itemKey] === true);
}

function renderItemDeliveryControls(container, student) {
  container.innerHTML = "";
  const allowedItems = getAllowedItemsByModality(student.modality);

  if (!allowedItems.length) {
    container.textContent = "Sem itens configurados";
    return null;
  }

  const delivered = allowedItems.filter((itemKey) => student.uniform?.items?.[itemKey]);
  const deliveredWrap = document.createElement("p");
  deliveredWrap.className = "item-delivery-current";
  deliveredWrap.textContent = delivered.length
    ? `Recebido: ${delivered.map(labelStockCategory).join(", ")}`
    : "Recebido: nenhum item";

  const select = document.createElement("select");
  select.className = "item-delivery-select";
  select.innerHTML = '<option value="">Selecionar item entregue</option>';

  allowedItems.forEach((itemKey) => {
    const option = document.createElement("option");
    option.value = itemKey;
    option.textContent = `${labelStockCategory(itemKey)}${student.uniform?.items?.[itemKey] ? " (já entregue)" : ""}`;
    select.appendChild(option);
  });

  container.appendChild(deliveredWrap);
  container.appendChild(select);

  return { select };
}

function hydrateProjectSelects() {
  if (!ui.loginProject) return;

  ui.loginProject.innerHTML = "";
  PROJECTS.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.key;
    option.textContent = project.label;
    ui.loginProject.appendChild(option);
  });

  ui.loginProject.value = state.currentProjectKey;
}

function currentProject() {
  return PROJECTS.find((project) => project.key === state.currentProjectKey) || PROJECTS[0];
}

function getVisibleNuclei(projectKey = state.currentProjectKey) {
  return PROJECT_NUCLEI[projectKey] || NUCLEI;
}

function getProjectCalendar(projectKey = state.currentProjectKey) {
  if (!state.classDaysByProject[projectKey]) {
    state.classDaysByProject[projectKey] = createEmptyCalendar();
  }
  return state.classDaysByProject[projectKey];
}

function getProjectStock(projectKey = state.currentProjectKey) {
  if (!state.uniformStockByProject[projectKey]) {
    state.uniformStockByProject[projectKey] = createDefaultCategoryStock();
  }
  return state.uniformStockByProject[projectKey];
}

function getProjectStudents(projectKey = state.currentProjectKey) {
  const visible = getVisibleNuclei(projectKey);
  return state.students.filter((student) => student.project === projectKey && visible.includes(student.nucleus));
}

function bindEvents() {
  ui.loginForm.addEventListener("submit", onLogin);
  ui.logoutBtn.addEventListener("click", onLogout);
  ui.studentForm.addEventListener("submit", onAddStudent);
  document.getElementById("studentNucleus").addEventListener("change", hydrateStudentScheduleOptions);
  ui.classCalendarForm.addEventListener("submit", onAddClassDay);
  ui.attendanceSearch?.addEventListener("input", (event) => {
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
    styleReportStatus(period);
    ui.reportStatus.textContent = `Relatório ${period} gerado em ${new Date().toLocaleString("pt-BR")}.`;
  });
  ui.userForm.addEventListener("submit", onCreateUser);
  ui.stockForm.addEventListener("submit", onAdjustStock);
  ui.loginProject.addEventListener("change", (event) => {
    state.currentProjectKey = event.target.value;
    hydrateNucleusSelects();
    hydrateStudentScheduleOptions();
    hydrateStudentModalityOptions();
    render();
  });

  ui.newRole.addEventListener("change", () => {
    document.getElementById("newNucleus").disabled = ui.newRole.value !== "professor";
  });

  ui.professorClassSave?.addEventListener("click", () => {
    const user = currentUser();
    if (!user || user.role !== "professor") return;
    saveAttendanceStaff(user.nucleus, "professor");
  });

  ui.professorHistoryDate?.addEventListener("change", () => {
    const user = currentUser();
    if (!user || user.role !== "professor") return;
    renderProfessorHistory(user.nucleus);
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
function normalizeStudentRecord(student) {
  const project = student.project || PROJECTS[0].key;
  const modality = student.modality || (PROJECT_MODALITIES[project]?.[0] || "");

  return {
    ...student,
    project,
    classSchedule: student.classSchedule || "",
    modality,
    uniform: {
      notes: student.uniform?.notes || "",
      items: normalizeDeliveryItems({ ...student, project, modality }),
    },
  };
}

function createDefaultStudents() {
  return [
    {
      id: crypto.randomUUID(),
      name: "Ana Beatriz",
      nucleus: "Campo Grande",
      contact: "Responsável: Carlos",
      attendance: "presente",
      modality: "Boxe",
      uniform: { delivered: true, notes: "Entregue" },
      classSchedule: "",
      project: PROJECTS[0].key,
    },
    {
      id: crypto.randomUUID(),
      name: "João Pedro",
      nucleus: "Realengo",
      contact: "Responsável: Marta",
      attendance: "falta",
      modality: "Jiu Jitso",
      uniform: { delivered: false, notes: "Aguardando" },
      classSchedule: "",
      project: PROJECTS[0].key,
    },
  ];
}
function createDefaultCategoryStock() {
  return Object.fromEntries(STOCK_CATEGORIES.map((item) => [item.key, 20]));
}

function createUniformStockByProject() {
  return Object.fromEntries(PROJECTS.map((project) => [project.key, createDefaultCategoryStock()]));
}

function createProjectCalendars() {
  return Object.fromEntries(PROJECTS.map((project) => [project.key, createEmptyCalendar()]));
}

function createEmptyAttendanceStaff() {
  return Object.fromEntries(
    NUCLEI.map((nucleus) => [
      nucleus,
      {
        classDate: "",
        classSchedule: "",
        professorName: "",
        monitorName: "",
      },
    ]),
  );
}

function createAttendanceStaffByProject() {
  return Object.fromEntries(PROJECTS.map((project) => [project.key, createEmptyAttendanceStaff()]));
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
function normalizeCalendar(rawCalendar, projectKey = state.currentProjectKey) {
  const normalized = createEmptyCalendar();
  getVisibleNuclei(projectKey).forEach((nucleus) => {
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
    state.students = createDefaultStudents().map(normalizeStudentRecord);
    state.classDaysByProject = createProjectCalendars();
    state.attendanceStaffByProject = createAttendanceStaffByProject();
    persist();
    return;
  }
  try {
    const parsed = JSON.parse(saved);
    state.users = parsed.users || createDefaultUsers();
    ensureRequiredUsers();
    const projectKeys = PROJECTS.map((project) => project.key);

    if (parsed.uniformStockByProject) {
      state.uniformStockByProject = Object.fromEntries(
        projectKeys.map((key) => [key, { ...createDefaultCategoryStock(), ...(parsed.uniformStockByProject[key] || {}) }]),
      );
    } else {
      const fallbackStock = parsed.uniformStock || createDefaultCategoryStock();
      state.uniformStockByProject = Object.fromEntries(projectKeys.map((key) => [key, { ...createDefaultCategoryStock(), ...fallbackStock }]));
    }

    if (parsed.classDaysByProject) {
      state.classDaysByProject = Object.fromEntries(
        projectKeys.map((key) => [key, normalizeCalendar(parsed.classDaysByProject[key], key)]),
      );
    } else {
      state.classDaysByProject = createProjectCalendars();
      state.classDaysByProject[PROJECTS[0].key] = normalizeCalendar(parsed.classDaysByNucleus, PROJECTS[0].key);
    }

    state.attendanceStaffByProject = Object.fromEntries(
      projectKeys.map((key) => {
        const rawStaff = parsed.attendanceStaffByProject?.[key] || parsed.attendanceStaffByNucleus || {};
        const normalized = createEmptyAttendanceStaff();
        getVisibleNuclei(key).forEach((nucleus) => {
          normalized[nucleus] = { ...normalized[nucleus], ...(rawStaff[nucleus] || {}) };
        });
        return [key, normalized];
      }),
    );

    state.students = (parsed.students || createDefaultStudents()).map(normalizeStudentRecord);

    state.history = (parsed.history || []).map((item) => ({
      ...item,
      project: item.project || PROJECTS[0].key,
    }));
  } catch {
    state.users = createDefaultUsers();
    ensureRequiredUsers();
    state.students = createDefaultStudents().map(normalizeStudentRecord);
    state.classDaysByProject = createProjectCalendars();
    state.attendanceStaffByProject = createAttendanceStaffByProject();
  }
}
function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      users: state.users,
      students: state.students,
      history: state.history,
      uniformStockByProject: state.uniformStockByProject,
      classDaysByProject: state.classDaysByProject,
      attendanceStaffByProject: state.attendanceStaffByProject,
    }),
  );
}
function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state.sessionUserId = parsed.userId || null;
    state.currentProjectKey = parsed.projectKey || PROJECTS[0].key;
  } catch {
    state.sessionUserId = raw;
    state.currentProjectKey = PROJECTS[0].key;
  }
}
function saveSession() {
  if (state.sessionUserId) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ userId: state.sessionUserId, projectKey: state.currentProjectKey }),
    );
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
  const selectedProjectKey = ui.loginProject.value;
  const user = state.users.find((item) => item.username === username && item.password === password);
  if (!user) {
    ui.loginMessage.textContent = "Usuário ou senha inválidos.";
    return;
  }
  state.sessionUserId = user.id;
  state.currentProjectKey = selectedProjectKey;
  saveSession();
  ui.loginForm.reset();
  hydrateProjectSelects();
  hydrateNucleusSelects();
  hydrateStudentScheduleOptions();
  hydrateStudentModalityOptions();
  hydrateStudentModalityOptions();
  ui.loginMessage.textContent = `Acesso liberado para ${labelRole(user.role)} • Projeto ${currentProject().label}.`;
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

function getProjectAttendanceStaff(projectKey = state.currentProjectKey) {
  if (!state.attendanceStaffByProject[projectKey]) {
    state.attendanceStaffByProject[projectKey] = createEmptyAttendanceStaff();
  }
  return state.attendanceStaffByProject[projectKey];
}

function getAttendanceStaffByNucleus(nucleus) {
  const attendanceStaff = getProjectAttendanceStaff();
  if (!attendanceStaff[nucleus]) {
    attendanceStaff[nucleus] = { classDate: "", classSchedule: "", professorName: "", monitorName: "" };
  }
  return attendanceStaff[nucleus];
}

function renderClassStaffPanel(nucleus, panelType) {
  const isProfessorPanel = panelType === "professor";
  const classDateInput = isProfessorPanel ? ui.professorClassDate : ui.attendanceClassDate;
  const classScheduleInput = isProfessorPanel ? ui.professorClassSchedule : ui.attendanceClassSchedule;
  const professorNameInput = isProfessorPanel ? ui.professorClassProfessorName : ui.attendanceClassProfessorName;
  const monitorNameInput = isProfessorPanel ? ui.professorClassMonitorName : ui.attendanceClassMonitorName;
  const statusEl = isProfessorPanel ? ui.professorClassStatus : ui.attendanceClassStatus;

  if (!classDateInput || !classScheduleInput || !professorNameInput || !monitorNameInput || !statusEl) return;

  if (!nucleus || nucleus === "todos") {
    classDateInput.value = "";
    classScheduleInput.value = "";
    professorNameInput.value = "";
    monitorNameInput.value = "";
    statusEl.textContent = "Selecione um núcleo para preencher professor e monitor da aula.";
    return;
  }

  const staff = getAttendanceStaffByNucleus(nucleus);
  classDateInput.value = staff.classDate || "";
  classScheduleInput.value = staff.classSchedule || "";
  professorNameInput.value = staff.professorName || "";
  monitorNameInput.value = staff.monitorName || "";
  statusEl.textContent = `Chamada do núcleo ${nucleus}: preencha data, turma, professor e monitor e clique em salvar.`;
}

function saveAttendanceStaff(nucleus, panelType) {
  const isProfessorPanel = panelType === "professor";
  const classDateInput = isProfessorPanel ? ui.professorClassDate : ui.attendanceClassDate;
  const classScheduleInput = isProfessorPanel ? ui.professorClassSchedule : ui.attendanceClassSchedule;
  const professorNameInput = isProfessorPanel ? ui.professorClassProfessorName : ui.attendanceClassProfessorName;
  const monitorNameInput = isProfessorPanel ? ui.professorClassMonitorName : ui.attendanceClassMonitorName;
  const statusEl = isProfessorPanel ? ui.professorClassStatus : ui.attendanceClassStatus;

  if (!nucleus || nucleus === "todos") return;

  const record = getAttendanceStaffByNucleus(nucleus);
  record.classDate = classDateInput?.value || "";
  record.classSchedule = classScheduleInput?.value.trim() || "";
  record.professorName = professorNameInput?.value.trim() || "";
  record.monitorName = monitorNameInput?.value.trim() || "";

  persist();
  statusEl.textContent = `Dados da chamada salvos para ${nucleus} em ${new Date().toLocaleString("pt-BR")}.`;
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
  ui.welcomeTitle.textContent = `Painel • ${labelRole(user.role)} • ${currentProject().label}`;
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
  const students = getProjectStudents().filter((student) => student.nucleus === user.nucleus);
  renderClassStaffPanel(user.nucleus, "professor");
  renderBoard(ui.professorBoard, students, user);
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
  if (!getVisibleNuclei().includes(nucleus)) return;
  const schedule = (ui.studentSchedule?.value || "").trim();
  const modality = (ui.studentModality?.value || "").trim();
  const contact = document.getElementById("studentContact").value.trim();
  if (!name) return;
  state.students.unshift({
    id: crypto.randomUUID(),
    name,
    nucleus,
    contact,
    attendance: "não registrado",
    modality,
    uniform: { notes: "", items: createEmptyDeliveryItems() },
    classSchedule: schedule,
    project: state.currentProjectKey,
  });
  persist();
  ui.studentForm.reset();
  hydrateStudentScheduleOptions();
  hydrateStudentModalityOptions();
  render();
}
function onAddClassDay(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;
  const nucleus = document.getElementById("calendarNucleus").value;
  if (!getVisibleNuclei().includes(nucleus)) return;
  const date = document.getElementById("calendarDate").value;
  const schedules = getSchedulesFromForm();
  if (!nucleus) return;
  const projectCalendar = getProjectCalendar();
  const nucleusData = projectCalendar[nucleus] || { days: [], schedules: [] };
  projectCalendar[nucleus] = nucleusData;
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
  hydrateStudentModalityOptions();
}
function renderBoard(target, students, actor) {
  target.innerHTML = "";
  const effectiveActor = actor || currentUser() || { role: "gestao", nucleus: null, username: "sistema" };
  const nuclei = effectiveActor.role === "professor" ? [effectiveActor.nucleus] : getVisibleNuclei();
  nuclei.forEach((nucleus) => {
    const grouped = students.filter((student) => student.nucleus === nucleus);
    const classStaff = getAttendanceStaffByNucleus(nucleus);
    const classDateLabel = classStaff.classDate
      ? new Date(`${classStaff.classDate}T00:00:00`).toLocaleDateString("pt-BR")
      : "não definida";
    const classScheduleLabel = classStaff.classSchedule || "horário não definido";
    const instructorLabel = classStaff.professorName || "não informado";
    const monitorLabel = classStaff.monitorName || "não informado";
    const column = document.createElement("article");
    column.className = "nucleus-column";
    column.innerHTML = `<div class="nucleus-header"><h3>${nucleus}</h3><span class="badge">${grouped.length}</span></div><p class="class-meta">Data da aula: ${classDateLabel} • Turma: ${classScheduleLabel} • Instrutor: ${instructorLabel} • Monitor: ${monitorLabel}</p>`;
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
      const schedule = classStaff.classSchedule || student.classSchedule || "horário não informado";
      card.querySelector(".student-class-info").textContent = `Turma/Horário: ${student.nucleus} • ${schedule}`;
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
      card.querySelector(".btn-justified").addEventListener("click", () => {
        student.attendance = "justificado";
        pushHistory(student, effectiveActor, "chamada", "Marcado como justificado");
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
      <td>${student.modality || "-"}</td>
      <td>${formatAllowedItems(student.modality)}</td>
      <td data-role="items"></td>
      <td><button data-role="save" class="small-btn" type="button">Salvar</button></td>
    `;

    const itemsCell = row.querySelector('[data-role="items"]');
    const itemControls = renderItemDeliveryControls(itemsCell, student);

    row.querySelector('[data-role="save"]').addEventListener("click", () => {
      const nextItems = { ...(student.uniform.items || createEmptyDeliveryItems()) };
      if (itemControls?.select?.value) {
        nextItems[itemControls.select.value] = true;
      }
      applyUniformUpdate(student, nextItems, user);
    });

    ui.professorUniformBody.appendChild(row);
  });
}
function renderProfessorHistory(nucleus) {
  ui.professorHistory.innerHTML = "";
  const selectedDate = ui.professorHistoryDate?.value || "";
  const entries = state.history
    .filter((item) => item.project === state.currentProjectKey && item.nucleus === nucleus)
    .filter((item) => (selectedDate ? item.timestamp.startsWith(selectedDate) : true))
    .slice(0, 60);
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
  const students = getProjectStudents();
  ui.totalStudents.textContent = students.length;
  ui.presentCount.textContent = students.filter((student) => student.attendance === "presente").length;
  ui.absentCount.textContent = students.filter((student) => student.attendance === "falta").length;
  ui.uniformDelivered.textContent = students.filter((student) => isKitDelivered(student)).length;
}
function renderClassDays() {
  ui.classCalendarBoard.innerHTML = "";
  const projectCalendar = getProjectCalendar();
  getVisibleNuclei().forEach((nucleus) => {
    const nucleusData = projectCalendar[nucleus] || { days: [], schedules: [] };
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
  if (!ui.attendanceReportBoard) return;
  ui.attendanceReportBoard.innerHTML = "";

  const nuclei = state.attendanceFilter === "todos" ? getVisibleNuclei() : [state.attendanceFilter];
  nuclei.forEach((nucleus) => {
    const students = getProjectStudents()
      .filter((student) => student.nucleus === nucleus)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const classStaff = getAttendanceStaffByNucleus(nucleus);

    const classDateLabel = classStaff.classDate ? new Date(`${classStaff.classDate}T00:00:00`).toLocaleDateString("pt-BR") : "não definida";
    const scheduleLabel = classStaff.classSchedule || "não definida";
    const professorLabel = classStaff.professorName || "não informado";
    const monitorLabel = classStaff.monitorName || "não informado";
    const enrolled = students.length;
    const present = students.filter((s) => s.attendance === "presente").length;
    const absent = students.filter((s) => s.attendance === "falta").length;
    const justified = students.filter((s) => s.attendance === "justificado").length;

    const card = document.createElement("article");
    card.className = "calendar-card";
    card.innerHTML = `
      <div class="calendar-header"><h3>${nucleus}</h3><span class="badge">${students.length} alunos</span></div>
      <p><strong>Data da aula:</strong> ${classDateLabel}</p>
      <p><strong>Turma/horário:</strong> ${scheduleLabel}</p>
      <p><strong>Professor:</strong> ${professorLabel}</p>
      <p><strong>Monitor:</strong> ${monitorLabel}</p>
      <p><strong>Total de alunos matriculados na turma:</strong> ${enrolled}</p>
      <p><strong>Resumo:</strong> ${present} presentes • ${absent} faltas • ${justified} justificados</p>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr><th>Aluno</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${students.map((s) => `<tr><td>${s.name}</td><td>${s.attendance}</td></tr>`).join("") || '<tr><td colspan="2" class="empty">Sem alunos.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
    ui.attendanceReportBoard.appendChild(card);
  });
}
function renderManagementUniform(user = currentUser()) {
  if (!user) return;
  const canDelete = user.role === "admin";
  const students = getProjectStudents().filter(
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
      <td>${student.modality || "-"}</td>
      <td>${formatAllowedItems(student.modality)}</td>
      <td data-role="items"></td>
      <td><button data-role="save" class="small-btn" type="button">Salvar</button></td>
      <td><button data-role="delete" class="ghost" type="button" ${canDelete ? "" : "disabled"}>Excluir</button></td>
    `;

    const itemsCell = row.querySelector('[data-role="items"]');
    const itemControls = renderItemDeliveryControls(itemsCell, student);

    row.querySelector('[data-role="save"]').addEventListener("click", () => {
      const nextItems = { ...(student.uniform.items || createEmptyDeliveryItems()) };
      if (itemControls?.select?.value) {
        nextItems[itemControls.select.value] = true;
      }
      applyUniformUpdate(student, nextItems, user);
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
function applyUniformUpdate(student, nextItems, user) {
  const stock = getProjectStock();
  const allowedItems = getAllowedItemsByModality(student.modality);
  const previousItems = student.uniform.items || createEmptyDeliveryItems();
  const normalizedNextItems = { ...previousItems, ...nextItems };

  for (const itemKey of allowedItems) {
    const wasDelivered = previousItems[itemKey] === true;
    const willDeliver = normalizedNextItems[itemKey] === true;

    if (!wasDelivered && willDeliver) {
      if ((stock[itemKey] || 0) <= 0) {
        normalizedNextItems[itemKey] = false;
        continue;
      }
      stock[itemKey] = Math.max(0, (stock[itemKey] || 0) - 1);
    }

    if (wasDelivered && !willDeliver) {
      stock[itemKey] = (stock[itemKey] || 0) + 1;
    }
  }

  student.uniform.items = normalizedNextItems;

  pushHistory(student, user, "uniforme", `Kit ${isKitDelivered(student) ? "entregue" : "parcial/pendente"} (${student.modality || "sem modalidade"})`);
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
    project: state.currentProjectKey,
  });
}
function renderStock() {
  ui.stockView.innerHTML = "";
  const stock = getProjectStock();
  STOCK_CATEGORIES.forEach((item) => {
    const card = document.createElement("article");
    card.className = "stock-card";
    card.innerHTML = `<h4>${item.label}</h4><p>${stock[item.key] || 0} unidades</p>`;
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
  const itemKey = document.getElementById("stockSize").value;
  const delta = Number(document.getElementById("stockDelta").value || 0);
  const stock = getProjectStock();
  stock[itemKey] = Math.max(0, (stock[itemKey] || 0) + delta);
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
  const project = currentProject();
  const lines = [
    "INSTITUTO IRMÃOS NOGUEIRA",
    `PROJETO: ${project.label.toUpperCase()}`,
    `PROCESSO: ${project.processNumber || "A definir"}`,
    `RELATÓRIO ${label.toUpperCase()}`,
    `Gerado em: ${generatedAt.toLocaleString("pt-BR")}`,
    `Período: ${start.toLocaleDateString("pt-BR")} até ${end.toLocaleDateString("pt-BR")}`,
    "",
  ];
  getVisibleNuclei().forEach((nucleus) => {
    const students = getProjectStudents()
      .filter((student) => student.nucleus === nucleus)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const projectCalendar = getProjectCalendar();
    const classStaff = getAttendanceStaffByNucleus(nucleus);
    const classDateLabel = classStaff.classDate ? formatDateLabel(classStaff.classDate) : "não definida";
    const classScheduleLabel = classStaff.classSchedule || "não definido";
    const instructorLabel = classStaff.professorName || "não informado";
    const monitorLabel = classStaff.monitorName || "não informado";
    const nucleusData = projectCalendar[nucleus] || { days: [], schedules: [] };
    const days = (nucleusData.days || []).filter((day) => day >= startIso && day <= endIso);
    lines.push(`TURMA/NÚCLEO: ${nucleus}`);
    lines.push(`Dados da chamada: Data da aula ${classDateLabel} | Turma ${classScheduleLabel} | Professor ${instructorLabel} | Monitor ${monitorLabel}`);
    lines.push(`Horários da turma: ${formatSchedules(nucleusData.schedules)}`);
    lines.push(`Dias com aula no período: ${days.length ? days.map(formatDateLabel).join(", ") : "nenhum"}`);
    lines.push(`Resumo da turma: ${students.length} alunos | ${students.filter((s) => s.attendance === "presente").length} presentes | ${students.filter((s) => s.attendance === "falta").length} faltas | ${students.filter((s) => s.attendance === "justificado").length} justificados | ${students.filter((s) => isKitDelivered(s)).length} kits entregues`);
    lines.push("Alunos:");
    if (!students.length) {
      lines.push("- Nenhum aluno cadastrado nesta turma.");
    } else {
      students.forEach((student) => {
        const attendanceDate = generatedAt.toLocaleDateString("pt-BR");
        lines.push(`- Nome completo: ${student.name} | Data do relatório: ${attendanceDate} | Horário matriculado: ${student.classSchedule || "não informado"} | Modalidade: ${student.modality || "não informada"} | Itens do kit: ${formatAllowedItems(student.modality)} | Presença: ${student.attendance} | Kit: ${isKitDelivered(student) ? "Entregue" : "Parcial/Pendente"}`);
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
  anchor.download = `relatorio-${state.currentProjectKey}-${period}-${toIsoDate(new Date())}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function styleReportStatus(period) {
  if (!ui.reportStatus) return;
  if (period === "semanal") {
    ui.reportStatus.classList.add("report-status-success");
    return;
  }
  ui.reportStatus.classList.remove("report-status-success");
}
