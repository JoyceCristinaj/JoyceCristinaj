const STORAGE_KEY = "crm-propostas-v1";

const form = document.getElementById("companyForm");
const clearAllBtn = document.getElementById("clearAll");
const template = document.getElementById("companyCardTemplate");
const searchInput = document.getElementById("searchInput");
const channelFilter = document.getElementById("channelFilter");

const CHANNEL_LABELS = {
  "nao-enviado": "Ainda não enviado",
  linkedin: "LinkedIn",
  email: "Email",
  instagram: "Instagram",
};

const state = {
  companies: loadCompanies(),
  query: "",
  filterChannel: "todos",
};

render();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const company = {
    id: crypto.randomUUID(),
    name: document.getElementById("name").value.trim(),
    contact: document.getElementById("contact").value.trim(),
    channel: document.getElementById("channel").value,
    status: document.getElementById("status").value,
    notes: document.getElementById("notes").value.trim(),
  };

  if (!company.name) {
    return;
  }

  state.companies.unshift(company);
  persist();
  render();

  form.reset();
  document.getElementById("channel").value = "nao-enviado";
  document.getElementById("status").value = "pendente";
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value.trim().toLowerCase();
  render();
});

channelFilter.addEventListener("change", (event) => {
  state.filterChannel = event.target.value;
  render();
});

clearAllBtn.addEventListener("click", () => {
  const confirmed = window.confirm("Tem certeza que deseja remover todas as empresas do CRM?");

  if (!confirmed) {
    return;
  }

  state.companies = [];
  persist();
  render();
});

function loadCompanies() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return [
      {
        id: crypto.randomUUID(),
        name: "Lumina Tech",
        contact: "Fernanda • fernanda@lumina.com",
        channel: "email",
        status: "enviada",
        notes: "Aguardando retorno do diretor comercial.",
      },
      {
        id: crypto.randomUUID(),
        name: "Mercado Central",
        contact: "João • joao@mercadocentral.com",
        channel: "nao-enviado",
        status: "pendente",
        notes: "Cliente pediu uma proposta enxuta.",
      },
      {
        id: crypto.randomUUID(),
        name: "BioSaúde Plus",
        contact: "Patrícia • patricia@biosaude.com",
        channel: "linkedin",
        status: "respondida",
        notes: "Resposta positiva, agendar reunião de fechamento.",
      },
    ];
  }

  try {
    const parsed = JSON.parse(saved);
    return parsed.map((company) => ({
      ...company,
      channel: CHANNEL_LABELS[company.channel] ? company.channel : "nao-enviado",
    }));
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.companies));
}

function getVisibleCompanies() {
  return state.companies.filter((company) => {
    const matchesQuery = company.name.toLowerCase().includes(state.query);
    const matchesChannel = state.filterChannel === "todos" || company.channel === state.filterChannel;
    return matchesQuery && matchesChannel;
  });
}

function render() {
  const groups = {
    pendente: [],
    enviada: [],
    respondida: [],
  };

  const visibleCompanies = getVisibleCompanies();

  visibleCompanies.forEach((company) => {
    if (groups[company.status]) {
      groups[company.status].push(company);
    }
  });

  renderColumn("pendente", groups.pendente);
  renderColumn("enviada", groups.enviada);
  renderColumn("respondida", groups.respondida);

  document.getElementById("statPending").textContent = groups.pendente.length;
  document.getElementById("statSent").textContent = groups.enviada.length;
  document.getElementById("statAnswered").textContent = groups.respondida.length;
}

function renderColumn(status, companies) {
  const list = document.getElementById(`list-${status}`);
  const counter = document.getElementById(`count-${status}`);

  list.innerHTML = "";
  counter.textContent = companies.length;

  if (companies.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Nenhuma empresa nesta visão.";
    list.appendChild(empty);
    return;
  }

  companies.forEach((company) => {
    const card = template.content.firstElementChild.cloneNode(true);

    card.querySelector(".company-name").textContent = company.name;
    card.querySelector(".company-contact").textContent = company.contact || "Contato não informado";
    card.querySelector(".company-channel").textContent = `Canal de envio: ${CHANNEL_LABELS[company.channel] || "Ainda não enviado"}`;
    card.querySelector(".company-notes").textContent = company.notes || "Sem observações.";

    const statusSelect = card.querySelector(".status-select");
    statusSelect.value = company.status;
    statusSelect.addEventListener("change", (event) => {
      company.status = event.target.value;
      persist();
      render();
    });

    const channelSelect = card.querySelector(".channel-select");
    channelSelect.value = company.channel || "nao-enviado";
    channelSelect.addEventListener("change", (event) => {
      company.channel = event.target.value;
      persist();
      render();
    });

    const deleteButton = card.querySelector(".delete-btn");
    deleteButton.addEventListener("click", () => {
      state.companies = state.companies.filter((item) => item.id !== company.id);
      persist();
      render();
    });

    list.appendChild(card);
  });
}
