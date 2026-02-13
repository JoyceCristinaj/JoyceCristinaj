const STORAGE_KEY = "instituto-irmaos-nogueira-v2";
const NUCLEI = ["Campo Grande", "Jacarezinho", "Realengo", "Santa Cruz"];

const studentForm = document.getElementById("studentForm");
const attendanceSearch = document.getElementById("attendanceSearch");
const attendanceNucleusFilter = document.getElementById("attendanceNucleusFilter");
const uniformNucleusFilter = document.getElementById("uniformNucleusFilter");
const attendanceBoard = document.getElementById("attendanceBoard");
const uniformTableBody = document.getElementById("uniformTableBody");
const attendanceCardTemplate = document.getElementById("attendanceCardTemplate");
const resetAllBtn = document.getElementById("resetAll");
const classCalendarForm = document.getElementById("classCalendarForm");
const classCalendarBoard = document.getElementById("classCalendarBoard");

const state = {
  students: [],
  classDaysByNucleus: createEmptyClassDays(),
  search: "",
  attendanceFilter: "todos",
  uniformFilter: "todos",
};

loadData();
render();

studentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const student = {
    id: crypto.randomUUID(),
    name: document.getElementById("studentName").value.trim(),
    nucleus: document.getElementById("studentNucleus").value,
    contact: document.getElementById("studentContact").value.trim(),
    attendance: "não registrado",
    uniform: {
      size: "",
      delivered: false,
      notes: "",
    },
  };

  if (!student.name) {
    return;
  }

  state.students.unshift(student);
  persist();
  render();
  studentForm.reset();
  document.getElementById("studentNucleus").value = "Campo Grande";
});

classCalendarForm.addEventListener("submit", (event) => {
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
  classCalendarForm.reset();
  document.getElementById("calendarNucleus").value = "Campo Grande";
});

attendanceSearch.addEventListener("input", (event) => {
  state.search = event.target.value.toLowerCase().trim();
  renderAttendance();
});

attendanceNucleusFilter.addEventListener("change", (event) => {
  state.attendanceFilter = event.target.value;
  renderAttendance();
});

uniformNucleusFilter.addEventListener("change", (event) => {
  state.uniformFilter = event.target.value;
  renderUniformTable();
});

resetAllBtn.addEventListener("click", () => {
  const confirmed = window.confirm("Deseja apagar todos os dados de presença, uniformes e calendário?");
  if (!confirmed) {
    return;
  }

  state.students = [];
  state.classDaysByNucleus = createEmptyClassDays();
  persist();
  render();
});

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
  const payload = {
    students: state.students,
    classDaysByNucleus: state.classDaysByNucleus,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function render() {
  renderClassCalendar();
  renderAttendance();
  renderUniformTable();
  renderMetrics();
}

function renderClassCalendar() {
  classCalendarBoard.innerHTML = "";

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
    classCalendarBoard.appendChild(card);
  });
}

function getAttendanceList() {
  return state.students.filter((student) => {
    const bySearch = student.name.toLowerCase().includes(state.search);
    const byNucleus =
      state.attendanceFilter === "todos" || student.nucleus === state.attendanceFilter;
    return bySearch && byNucleus;
  });
}

function renderAttendance() {
  const visible = getAttendanceList();
  attendanceBoard.innerHTML = "";

  NUCLEI.forEach((nucleus) => {
    if (state.attendanceFilter !== "todos" && state.attendanceFilter !== nucleus) {
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
      const card = attendanceCardTemplate.content.firstElementChild.cloneNode(true);
      card.querySelector(".student-name").textContent = student.name;
      card.querySelector(".student-contact").textContent =
        student.contact || "Contato não informado";
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

    attendanceBoard.appendChild(column);
  });
}

function getUniformList() {
  return state.students.filter(
    (student) => state.uniformFilter === "todos" || student.nucleus === state.uniformFilter,
  );
}

function renderUniformTable() {
  const students = getUniformList();
  uniformTableBody.innerHTML = "";

  if (students.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="6" class="empty">Nenhum aluno para este núcleo.</td>';
    uniformTableBody.appendChild(row);
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

    uniformTableBody.appendChild(row);
  });
}

function renderMetrics() {
  const total = state.students.length;
  const present = state.students.filter((student) => student.attendance === "presente").length;
  const absent = state.students.filter((student) => student.attendance === "falta").length;
  const uniformDelivered = state.students.filter((student) => student.uniform.delivered).length;

  document.getElementById("totalStudents").textContent = total;
  document.getElementById("presentCount").textContent = present;
  document.getElementById("absentCount").textContent = absent;
  document.getElementById("uniformDelivered").textContent = uniformDelivered;
}
