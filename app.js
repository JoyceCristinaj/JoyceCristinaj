const STORAGE_KEY = "instituto-irmaos-nogueira-v3";
const SESSION_KEY = "instituto-irmaos-nogueira-session";
const NUCLEI = ["Campo Grande", "Jacarezinho", "Realengo", "Santa Cruz"];

const CREDENTIALS = {
  professor: { username: "professor", password: "prof123" },
  admin: { username: "gestao", password: "gestao123" },
};

const state = {
  students: [],
  classDaysByNucleus: createEmptyClassDays(),
  search: "",
  attendanceFilter: "todos",
  professorSearch: "",
  professorFilter: "todos",
  uniformFilter: "todos",
  activeRole: null,
};

const ui = {
  loginForm: document.getElementById("loginForm"),
  loginRole: document.getElementById("loginRole"),
  loginUsername: document.getElementById("loginUsername"),
  loginPassword: document.getElementById("loginPassword"),
  accessStatus: document.getElementById("accessStatus"),
  logoutBtn: document.getElementById("logoutBtn"),
  professorArea: document.getElementById("professorArea"),
  adminArea: document.getElementById("adminArea"),
  professorSearch: document.getElementById("professorSearch"),
  professorNucleusFilter: document.getElementById("professorNucleusFilter"),
  professorAttendanceBoard: document.getElementById("professorAttendanceBoard"),
  studentForm: document.getElementById("studentForm"),
  classCalendarForm: document.getElementById("classCalendarForm"),
  attendanceSearch: document.getElementById("attendanceSearch"),
  attendanceNucleusFilter: document.getElementById("attendanceNucleusFilter"),
  uniformNucleusFilter: document.getElementById("uniformNucleusFilter"),
  attendanceBoard: document.getElementById("attendanceBoard"),
  uniformTableBody: document.getElementById("uniformTableBody"),
  attendanceCardTemplate: document.getElementById("attendanceCardTemplate"),
  resetAllBtn: document.getElementById("resetAll"),
  classCalendarBoard: document.getElementById("classCalendarBoard"),
  reportPeriod: document.getElementById("reportPeriod"),
  generateReportBtn: document.getElementById("generateReportBtn"),
  reportStatus: document.getElementById("reportStatus"),
};

loadData();
loadSession();
bindEvents();
render();

function bindEvents() {
  ui.loginForm.addEventListener("submit", handleLogin);
  ui.logoutBtn.addEventListener("click", logout);

  ui.professorSearch.addEventListener("input", (event) => {
    state.professorSearch = event.target.value.toLowerCase().trim();
    renderProfessorAttendance();
  });

  ui.professorNucleusFilter.addEventListener("change", (event) => {
    state.professorFilter = event.target.value;
    renderProfessorAttendance();
  });

  ui.studentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const student = {
      id: crypto.randomUUID(),
      name: document.getElementById("studentName").value.trim(),
      nucleus: document.getElementById("studentNucleus").value,
      contact: document.getElementById("studentContact").value.trim(),
      attendance: "não registrado",
      uniform: { size: "", delivered: false, notes: "" },
    };

    if (!student.name) {
      return;
    }

    state.students.unshift(student);
    persist();
    render();
    ui.studentForm.reset();
    document.getElementById("studentNucleus").value = "Campo Grande";
  });

  ui.classCalendarForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const nucleus = document.getElementById("calendarNucleus").value;
    const date = document.getElementById("calendarDate").value;

    if (!nucleus || !date) {
      return;
    }

    const days = state.classDaysByNucleus[nucleus] || [];

    if (days.includes(date)) {
      window.alert("Esse dia já foi registrado para este núcleo.");
      return;
    }

    days.push(date);
    days.sort((a, b) => b.localeCompare(a));
    state.classDaysByNucleus[nucleus] = days;

    persist();
    renderClassCalendar();
    ui.classCalendarForm.reset();
    document.getElementById("calendarNucleus").value = "Campo Grande";
  });

  ui.attendanceSearch.addEventListener("input", (event) => {
    state.search = event.target.value.toLowerCase().trim();
    renderAttendance();
  });

  ui.attendanceNucleusFilter.addEventListener("change", (event) => {
    state.attendanceFilter = event.target.value;
    renderAttendance();
  });

  ui.uniformNucleusFilter.addEventListener("change", (event) => {
    state.uniformFilter = event.target.value;
    renderUniformTable();
  });

  ui.resetAllBtn.addEventListener("click", () => {
    const confirmed = window.confirm("Deseja apagar todos os dados de presença, uniformes e calendário?");
    if (!confirmed) {
      return;
    }

    state.students = [];
    state.classDaysByNucleus = createEmptyClassDays();
    persist();
    render();
  });

  ui.generateReportBtn.addEventListener("click", () => {
    const period = ui.reportPeriod.value;
    const reportText = buildFullReport(period);
    downloadReport(reportText, period);

    const generatedAt = new Date().toLocaleString("pt-BR");
    ui.reportStatus.textContent = `Relatório ${period} gerado com sucesso em ${generatedAt}.`;
  });
}

function handleLogin(event) {
  event.preventDefault();

  const role = ui.loginRole.value;
  const username = ui.loginUsername.value.trim();
  const password = ui.loginPassword.value;
  const valid = CREDENTIALS[role];

  if (valid && username === valid.username && password === valid.password) {
    state.activeRole = role;
    localStorage.setItem(SESSION_KEY, role);
    ui.accessStatus.textContent = `Login realizado com sucesso na área ${role === "admin" ? "Gestão" : "Professor"}.`;
    ui.loginForm.reset();
    renderAccess();
    return;
  }

  ui.accessStatus.textContent = "Usuário ou senha inválidos. Tente novamente.";
}

function logout() {
  state.activeRole = null;
  localStorage.removeItem(SESSION_KEY);
  ui.accessStatus.textContent = "Sessão encerrada. Faça login para acessar.";
  renderAccess();
}

function loadSession() {
  const role = localStorage.getItem(SESSION_KEY);
  state.activeRole = role === "admin" || role === "professor" ? role : null;
}

function renderAccess() {
  const isAdmin = state.activeRole === "admin";
  const isProfessor = state.activeRole === "professor";

  ui.adminArea.classList.toggle("hidden", !isAdmin);
  ui.professorArea.classList.toggle("hidden", !isProfessor);
  ui.logoutBtn.classList.toggle("hidden", !state.activeRole);
}

function createEmptyClassDays() {
  return {
    "Campo Grande": [],
    Jacarezinho: [],
    Realengo: [],
    "Santa Cruz": [],
  };
}

function createDefaultData() {
  return {
    students: [
      {
        id: crypto.randomUUID(),
        name: "Ana Beatriz",
        nucleus: "Campo Grande",
        contact: "Responsável: Carlos • (21) 98888-1111",
        attendance: "presente",
        uniform: { size: "M", delivered: true, notes: "Recebeu conjunto completo." },
      },
      {
        id: crypto.randomUUID(),
        name: "João Pedro",
        nucleus: "Realengo",
        contact: "Responsável: Marta • (21) 97777-2222",
        attendance: "falta",
        uniform: { size: "G", delivered: false, notes: "Aguardando reposição." },
      },
    ],
    classDaysByNucleus: {
      "Campo Grande": ["2026-02-10", "2026-02-08"],
      Jacarezinho: ["2026-02-11"],
      Realengo: ["2026-02-09"],
      "Santa Cruz": [],
    },
  };
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    const defaults = createDefaultData();
    state.students = defaults.students;
    state.classDaysByNucleus = defaults.classDaysByNucleus;
    return;
  }

  try {
    const parsed = JSON.parse(saved);

    state.students = (parsed.students || []).map((student) => ({
      ...student,
      nucleus: NUCLEI.includes(student.nucleus) ? student.nucleus : "Campo Grande",
      attendance: ["presente", "falta", "não registrado"].includes(student.attendance)
        ? student.attendance
        : "não registrado",
      uniform: {
        size: student.uniform?.size || "",
        delivered: Boolean(student.uniform?.delivered),
        notes: student.uniform?.notes || "",
      },
    }));

    const loadedCalendar = createEmptyClassDays();
    NUCLEI.forEach((nucleus) => {
      const days = parsed.classDaysByNucleus?.[nucleus] || [];
      loadedCalendar[nucleus] = days
        .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
        .sort((a, b) => b.localeCompare(a));
    });

    state.classDaysByNucleus = loadedCalendar;
  } catch {
    state.students = [];
    state.classDaysByNucleus = createEmptyClassDays();
  }
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ students: state.students, classDaysByNucleus: state.classDaysByNucleus }),
  );
}

function getFilteredStudents(query, filter) {
  return state.students.filter((student) => {
    const bySearch = student.name.toLowerCase().includes(query);
    const byNucleus = filter === "todos" || student.nucleus === filter;
    return bySearch && byNucleus;
  });
}

function render() {
  renderAccess();
  renderClassCalendar();
  renderAttendance();
  renderProfessorAttendance();
  renderUniformTable();
  renderMetrics();
}

function renderClassCalendar() {
  ui.classCalendarBoard.innerHTML = "";

  NUCLEI.forEach((nucleus) => {
    const card = document.createElement("article");
    card.className = "calendar-card";

    const days = state.classDaysByNucleus[nucleus] || [];

    card.innerHTML = `
      <div class="calendar-header">
        <h3>${nucleus}</h3>
        <span class="badge">${days.length} aulas</span>
      </div>
    `;

    if (days.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Sem aula registrada ainda.";
      card.appendChild(empty);
    }

    const list = document.createElement("ul");
    list.className = "calendar-list";

    days.forEach((date) => {
      const item = document.createElement("li");
      item.className = "calendar-item";
      const readable = new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");

      item.innerHTML = `
        <span>${readable}</span>
        <button class="ghost tiny-btn" type="button">Remover</button>
      `;

      item.querySelector("button").addEventListener("click", () => {
        state.classDaysByNucleus[nucleus] = (state.classDaysByNucleus[nucleus] || []).filter(
          (day) => day !== date,
        );
        persist();
        renderClassCalendar();
      });

      list.appendChild(item);
    });

    card.appendChild(list);
    ui.classCalendarBoard.appendChild(card);
  });
}

function renderBoard(targetElement, query, filter) {
  targetElement.innerHTML = "";
  const visible = getFilteredStudents(query, filter);

  NUCLEI.forEach((nucleus) => {
    if (filter !== "todos" && filter !== nucleus) {
      return;
    }

    const students = visible.filter((student) => student.nucleus === nucleus);
    const column = document.createElement("article");
    column.className = "nucleus-column";
    column.innerHTML = `
      <div class="nucleus-header">
        <h3>${nucleus}</h3>
        <span class="badge">${students.length}</span>
      </div>
    `;

    if (students.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Nenhum aluno neste filtro.";
      column.appendChild(empty);
    }

    students.forEach((student) => {
      const card = ui.attendanceCardTemplate.content.firstElementChild.cloneNode(true);
      card.querySelector(".student-name").textContent = student.name;
      card.querySelector(".student-contact").textContent = student.contact || "Contato não informado";
      card.querySelector(".student-status").textContent = `Status: ${student.attendance}`;

      card.querySelector(".btn-present").addEventListener("click", () => {
        student.attendance = "presente";
        persist();
        render();
      });

      card.querySelector(".btn-absent").addEventListener("click", () => {
        student.attendance = "falta";
        persist();
        render();
      });

      column.appendChild(card);
    });

    targetElement.appendChild(column);
  });
}

function renderAttendance() {
  renderBoard(ui.attendanceBoard, state.search, state.attendanceFilter);
}

function renderProfessorAttendance() {
  renderBoard(ui.professorAttendanceBoard, state.professorSearch, state.professorFilter);
}

function renderUniformTable() {
  const students = state.students.filter(
    (student) => state.uniformFilter === "todos" || student.nucleus === state.uniformFilter,
  );

  ui.uniformTableBody.innerHTML = "";

  if (students.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="6" class="empty">Nenhum aluno para este núcleo.</td>';
    ui.uniformTableBody.appendChild(row);
    return;
  }

  students.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.name}</td>
      <td>${student.nucleus}</td>
      <td>
        <select data-role="size">
          <option value="">Selecionar</option>
          <option value="PP">PP</option>
          <option value="P">P</option>
          <option value="M">M</option>
          <option value="G">G</option>
          <option value="GG">GG</option>
        </select>
      </td>
      <td>
        <select data-role="delivered">
          <option value="nao">Não entregue</option>
          <option value="sim">Entregue</option>
        </select>
      </td>
      <td><input data-role="notes" type="text" placeholder="Observação da entrega" /></td>
      <td><button data-role="save" class="small-btn" type="button">Salvar</button></td>
    `;

    const sizeSelect = row.querySelector('[data-role="size"]');
    const deliveredSelect = row.querySelector('[data-role="delivered"]');
    const notesInput = row.querySelector('[data-role="notes"]');

    sizeSelect.value = student.uniform.size || "";
    deliveredSelect.value = student.uniform.delivered ? "sim" : "nao";
    notesInput.value = student.uniform.notes || "";

    row.querySelector('[data-role="save"]').addEventListener("click", () => {
      student.uniform.size = sizeSelect.value;
      student.uniform.delivered = deliveredSelect.value === "sim";
      student.uniform.notes = notesInput.value.trim();
      persist();
      renderMetrics();
    });

    ui.uniformTableBody.appendChild(row);
  });
}

function getPeriodRange(period) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "mensal") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end, label: "Mensal" };
  }

  const startWeek = new Date(end);
  startWeek.setDate(end.getDate() - 6);
  return { start: startWeek, end, label: "Semanal" };
}

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildFullReport(period) {
  const { start, end, label } = getPeriodRange(period);
  const startIso = toIsoDate(start);
  const endIso = toIsoDate(end);
  const generatedAt = new Date().toLocaleString("pt-BR");

  const total = state.students.length;
  const present = state.students.filter((student) => student.attendance === "presente").length;
  const absent = state.students.filter((student) => student.attendance === "falta").length;
  const uniformsDelivered = state.students.filter((student) => student.uniform.delivered).length;

  const lines = [
    "INSTITUTO IRMÃOS NOGUEIRA",
    "RELATÓRIO COMPLETO PARA GESTÃO E PRESTAÇÃO DE CONTAS",
    `Período: ${label} (${start.toLocaleDateString("pt-BR")} a ${end.toLocaleDateString("pt-BR")})`,
    `Gerado em: ${generatedAt}`,
    "",
    "RESUMO GERAL",
    `- Total de alunos cadastrados: ${total}`,
    `- Presentes (status atual): ${present}`,
    `- Faltas (status atual): ${absent}`,
    `- Uniformes entregues: ${uniformsDelivered}`,
    `- Uniformes pendentes: ${total - uniformsDelivered}`,
    "",
    "DETALHAMENTO POR NÚCLEO",
  ];

  NUCLEI.forEach((nucleus) => {
    const studentsByNucleus = state.students.filter((student) => student.nucleus === nucleus);
    const classDays = (state.classDaysByNucleus[nucleus] || []).filter(
      (date) => date >= startIso && date <= endIso,
    );

    lines.push(`\n${nucleus.toUpperCase()}`);
    lines.push(`- Alunos: ${studentsByNucleus.length}`);
    lines.push(`- Presentes: ${studentsByNucleus.filter((s) => s.attendance === "presente").length}`);
    lines.push(`- Faltas: ${studentsByNucleus.filter((s) => s.attendance === "falta").length}`);
    lines.push(`- Uniformes entregues: ${studentsByNucleus.filter((s) => s.uniform.delivered).length}`);

    if (classDays.length === 0) {
      lines.push("- Dias com aula no período: nenhum registro.");
    } else {
      const formatted = classDays
        .map((date) => new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR"))
        .join(", ");
      lines.push(`- Dias com aula no período: ${formatted}.`);
    }
  });

  return lines.join("\n");
}

function downloadReport(content, period) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const today = toIsoDate(new Date());
  anchor.href = url;
  anchor.download = `relatorio-${period}-${today}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function renderMetrics() {
  document.getElementById("totalStudents").textContent = state.students.length;
  document.getElementById("presentCount").textContent = state.students.filter(
    (student) => student.attendance === "presente",
  ).length;
  document.getElementById("absentCount").textContent = state.students.filter(
    (student) => student.attendance === "falta",
  ).length;
  document.getElementById("uniformDelivered").textContent = state.students.filter(
    (student) => student.uniform.delivered,
  ).length;
}
