// admin-dashboard.js
import { fetchWithErrorHandling, toastNotification, tokenValidator } from "./script.js";

const tokenExample = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30"

// Módulo do Dashboard de Administrador
function initializeAdminDashboard() {
  // 1. Verificação de autenticação e configuração inicial
  const currentUser = JSON.parse(localStorage.getItem("user"));
  if (!currentUser || (currentUser.nivel != 1 && currentUser.nivel != 2)) window.location.href = "login.html";

  if (currentUser && currentUser.nivel === 2) {
    document.getElementById("addAdmin").style.display = "inline-block";
    document.getElementById("adminRegistrationModal").style.display = "none"; // manter oculto até clique
  }

  // Configurar informações do administrador
  document.getElementById("adminName").textContent = currentUser.name;
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });

  document.getElementById("editUserBtn").addEventListener("click", () => {
    openUserEditModal(currentUser._id);
  })

  // 2. Seleção de elementos DOM
  const DOM = {
    filters: {
      status: document.getElementById("statusFilter"),
      clientName: document.getElementById("clientNameInput"),
      barber: document.getElementById("barberSelect"),
      service: document.getElementById("serviceSelect"),
      startDate: document.getElementById("startDateFilter"),
      endDate: document.getElementById("endDateFilter"),
      singleDay: document.getElementById("singleDayFilter"),
      sortOrder: document.getElementById("sortOrderSelect"),
      sortColumn: document.getElementById("sortColumnSelect"),
    },
    buttons: {
      today: document.getElementById("todayBtn"),
      refresh: document.getElementById("refreshBtn"),
      clearFilters: document.getElementById("clearFiltersBtn"),
      prevPage: document.getElementById("prevPageBtn"),
      nextPage: document.getElementById("nextPageBtn"),
      editUserBtn: document.getElementById("editUserBtn")
    },
    table: {
      body: document.getElementById("appointmentsTableBody"),
      loading: document.getElementById("loadingMessage"),
      resultsCount: document.getElementById("resultsCount"),
      paginationNumbers: document.getElementById("paginationNumbers"),
      itemsPerPage: document.getElementById("itemsPerPage"),
    },
    modals: {
      confirmation: document.getElementById("confirmationModal"),
      confirmationMessage: document.getElementById("confirmationMessage"),
      confirmAction: document.getElementById("confirmActionBtn"),
      cancelAction: document.getElementById("cancelActionBtn"),
      adminRegistration: document.getElementById("adminRegistrationModal"),
      adminForm: document.getElementById("adminRegistrationForm"),
      cancelAdmin: document.getElementById("cancelAdminRegistration"),
      adminMessage: document.getElementById("adminRegisterMessage")
    },
    adminFormFields: {
      name: document.getElementById("adminRegisterName"),
      email: document.getElementById("adminRegisterEmail"),
      password: document.getElementById("adminRegisterPassword"),
    },
    addAdminBtn: document.getElementById("addAdmin"),
  };

  // 3. Estado da aplicação
  const state = {
    pendingAction: null,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: Number.parseInt(DOM.table.itemsPerPage.value),
    totalItems: 0,
    simulatedAppointments: JSON.parse(localStorage.getItem("simulatedAppointments")) || [],
  };

  // 4. Constantes auxiliares
  const statusLabels = {
    canceled: "Cancelado",
    confirmed: "Confirmado",
    scheduled: "Agendado",
  };

  // Configurar modal de edição de usuário
  setupUserEditModal();

  // 5. Funções principais
  async function loadStats(page = 1) {
    DOM.table.loading.style.display = "block";
    DOM.table.body.innerHTML = "";
    state.currentPage = page;

    try {
      state.itemsPerPage = Number.parseInt(DOM.table.itemsPerPage.value);
      const filters = buildFilters(page);
      const appointments = await fetchAppointments(filters);
      if(appointments.error){
        //tokenValidator(appointments)
      }
      const totalAppointments = appointments.total
      document.getElementById("totalAppointments").textContent = totalAppointments

      updateStatistics(appointments);
      renderAppointments(appointments.data);
      setupActionButtons();
    } catch (error) {
      console.log("Não foi possível exibir dados da API " + error);
    } finally {
      DOM.table.loading.style.display = "none";
    }
  }

  // 6. Funções auxiliares
  function buildFilters(page) {
    const filters = {
      page: page,
      limit: state.itemsPerPage,
    };

    if (DOM.filters.status.value && DOM.filters.status.value !== "all") {
      filters.status = DOM.filters.status.value;
    }

    if (DOM.filters.clientName.value.trim()) {
      filters.client_name = DOM.filters.clientName.value.trim();
    }

    if (DOM.filters.barber.value && DOM.filters.barber.value !== "all") {
      filters.barber_name = DOM.filters.barber.value;
    }

    if (DOM.filters.service.value && DOM.filters.service.value !== "all") {
      filters.service = DOM.filters.service.value;
    }

    if (DOM.filters.startDate.value) {
      filters.start_date = DOM.filters.startDate.value;
    }

    if (DOM.filters.endDate.value) {
      filters.end_date = DOM.filters.endDate.value;
    }

    if (DOM.filters.sortColumn.value) {
      filters.sort = DOM.filters.sortColumn.value;
      filters.order = DOM.filters.sortOrder.value;
    }

    return filters;
  }

  async function fetchAppointments(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const appointmentsUrl = `${window.env.API_URL}api/agendamentos${queryString ? "?" + queryString : ""}`;
    const appointments = await fetchWithErrorHandling(appointmentsUrl, {
      headers : {'access-token' : tokenExample}
    });
    return appointments
  }

  function updateStatistics(appointments) {
    state.totalItems = appointments.total;
    state.totalPages = appointments.pagination.pages;
    state.currentPage = appointments.pagination.page;
    state.itemsPerPage = appointments.pagination.limit;
    updateResultsCount(appointments.data.length, state.totalItems);
    updatePaginationControls();
  }

  function renderAppointments(appointments) {
    appointments.forEach(appointment => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${new Date(appointment.date).toLocaleString("pt-BR")}</td>
        <td>${appointment.client_name}</td>
        <td>${appointment.services.map(service => service.name).join(", ")}</td>
        <td>${appointment.barber_name}</td>
        <td>${appointment.total_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        <td class='status-${appointment.status}'>${statusLabels[appointment.status] || appointment.status}</td>
        <td class='appointments-table-actions'>
          ${appointment.status === "scheduled"
          ? `<button class="btn btn-confirm confirm-btn" data-id="${appointment._id}">Confirmar</button>
               <button class="btn btn-secondary cancel-btn" data-id="${appointment._id}">Cancelar</button>`
          : appointment.status === "canceled"
            ? `<button class="btn btn-secondary delete-btn" data-id="${appointment._id}">Deletar</button>`
            : "-"
        }
        </td>
      `;
      DOM.table.body.appendChild(row);
    });
  }

  function setupActionButtons() {
    document.querySelectorAll(".confirm-btn").forEach(button => {
      button.addEventListener("click", () => showConfirmationModal(button, "confirmed"));
    });

    document.querySelectorAll(".cancel-btn").forEach(button => {
      button.addEventListener("click", () => showConfirmationModal(button, "canceled"));
    });

    document.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", () => showConfirmationModal(button, "delete"));
    });
  }

  // 7. Funções de manipulação de agendamentos

  function showConfirmationModal(button, action) {
    const appointmentId = button.getAttribute("data-id");
    let message = "";

    switch (action) {
      case "confirmed": message = "Deseja confirmar este agendamento?"; break;
      case "canceled": message = "Deseja cancelar este agendamento?"; break;
      case "delete": message = "Deseja excluir este agendamento permanentemente?"; break;
    }

    // Armazena a ação pendente no state
    state.pendingAction = {
      id: appointmentId,
      action: action,
      button: button
    };

    DOM.modals.confirmationMessage.textContent = message;
    DOM.modals.confirmation.style.display = "flex";

    // Remove todos os listeners antigos
    DOM.modals.confirmAction.onclick = null;
    DOM.modals.cancelAction.onclick = null;

    // Adiciona os novos listeners
    DOM.modals.confirmAction.addEventListener("click", executePendingAction);
    DOM.modals.cancelAction.addEventListener("click", () => {
      DOM.modals.confirmation.style.display = "none";
      state.pendingAction = null;
    });
  }

  function executePendingAction() {
    if (!state.pendingAction) return;

    const { action, button } = state.pendingAction;
    DOM.modals.confirmation.style.display = "none";

    if (action === "deleteAccount") {
      deleteUserAccount();
    } else if (action === "delete") {
      deleteAppointment(button.getAttribute("data-id"), button);
    } else {
      updateAppointmentStatus(button.getAttribute("data-id"), action, button);
    }

    state.pendingAction = null;
  }

  async function deleteUserAccount() {
    try {
      DOM.modals.confirmationMessage.textContent = "Excluindo conta...";
      DOM.modals.confirmAction.disabled = true;

      const currentUser = JSON.parse(localStorage.getItem("user"));

      // Chamar API para deletar conta
      const response = await fetchWithErrorHandling(`${window.env.API_URL}api/usuarios/${currentUser._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'access-token' : tokenExample}
      });

      if (!response || response.error) {
        throw new Error(response.errors ? response.errors[0].msg : response.message || "Erro ao excluir conta");
      }

      // Limpar localStorage e redirecionar
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      DOM.modals.confirmationMessage.textContent = "Erro ao excluir conta. Tente novamente.";
      DOM.modals.confirmAction.disabled = false;
    }
  }

  async function updateAppointmentStatus(appointmentId, statusValue, button) {
    const row = button.closest("tr");
    const statusTextContent = statusValue == "canceled" ? "Cancelado" : "Confirmado";

    try {
      const response = await fetchWithErrorHandling(`${window.env.API_URL}api/agendamentos/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "access-token" : tokenExample},
        body : JSON.stringify({status : statusValue})
      });

      if(!response.error){
        row.style.opacity = "0.7";
        row.cells[5].textContent = statusTextContent;
        row.cells[5].classList.remove(`status-scheduled`);
        row.cells[5].classList.add(`status-${statusValue}`);
        row.cells[6].innerHTML = "-";
      }
    } catch (error) {
      console.error(`Falha ao ${action}:`, error);
      row.style.opacity = "1";
    }
  }

  async function deleteAppointment(appointmentId, button) {
    const row = button.closest("tr");
    try {
      const response = await fetchWithErrorHandling(`${window.env.API_URL}api/agendamentos/${appointmentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "access-token" : tokenExample},
      });

      if(!response.error){
        row.remove();
        updateResultsCount(document.querySelectorAll("#appointmentsTableBody tr").length, state.totalItems - 1);
        loadStats(state.currentPage)
      }
    } catch (error) {
      console.error(`Falha ao deletar:`, error);
      row.style.opacity = "1";
    }
  }

  // 8. Funções de paginação e filtros
  function updateResultsCount(currentCount, totalCount) {
    DOM.table.resultsCount.textContent = `Exibindo ${currentCount} de ${totalCount} agendamentos`;
  }

  function updatePaginationControls() {
    DOM.buttons.prevPage.disabled = state.currentPage <= 1;
    DOM.buttons.nextPage.disabled = state.currentPage >= state.totalPages;
    DOM.table.paginationNumbers.innerHTML = "";

    if (state.totalPages <= 0) return;

    let startPage = Math.max(1, state.currentPage - 2);
    const endPage = Math.min(state.totalPages, startPage + 4);

    if (endPage - startPage < 4 && startPage > 1) {
      startPage = Math.max(1, endPage - 4);
    }

    if (startPage > 1) {
      addPageNumber(1);
      if (startPage > 2) {
        addEllipsis();
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      addPageNumber(i);
    }

    if (endPage < state.totalPages) {
      if (endPage < state.totalPages - 1) {
        addEllipsis();
      }
      addPageNumber(state.totalPages);
    }
  }

  function addPageNumber(pageNum) {
    const pageElement = document.createElement("div");
    pageElement.className = `page-number ${pageNum === state.currentPage ? "active" : ""}`;
    pageElement.textContent = pageNum;
    pageElement.addEventListener("click", () => {
      if (pageNum !== state.currentPage) {
        loadStats(pageNum);
      }
    });
    DOM.table.paginationNumbers.appendChild(pageElement);
  }

  function addEllipsis() {
    const ellipsis = document.createElement("div");
    ellipsis.className = "page-number";
    ellipsis.textContent = "...";
    ellipsis.style.cursor = "default";
    DOM.table.paginationNumbers.appendChild(ellipsis);
  }

  function clearFilters() {
    DOM.filters.status.value = "all";
    DOM.filters.clientName.value = "";
    DOM.filters.barber.value = "all";
    DOM.filters.service.value = "all";
    DOM.filters.startDate.value = "";
    DOM.filters.endDate.value = "";
    DOM.filters.singleDay.checked = false;
    DOM.filters.sortOrder.value = "asc";
    DOM.filters.sortColumn.value = "date";
    loadStats(1);
  }

  function setToday() {
    const today = new Date().toISOString().split("T")[0];
    DOM.filters.startDate.value = today;
    DOM.filters.endDate.value = today;
    DOM.filters.singleDay.checked = true;
  }

  function syncDates() {
    if (DOM.filters.singleDay.checked) {
      if (this === DOM.filters.startDate) {
        DOM.filters.endDate.value = DOM.filters.startDate.value;
      } else {
        DOM.filters.startDate.value = DOM.filters.endDate.value;
      }
    }
    loadStats();
  }

  // 9. Funções para dados simulados
  function filterSimulatedAppointments() {
    let filteredAppointments = [...state.simulatedAppointments];

    if (DOM.filters.status.value !== "all") {
      filteredAppointments = filteredAppointments.filter(a => a.status === DOM.filters.status.value);
    }

    if (DOM.filters.clientName.value.trim()) {
      const searchTerm = DOM.filters.clientName.value.trim().toLowerCase();
      filteredAppointments = filteredAppointments.filter(a => a.client_name.toLowerCase().includes(searchTerm));
    }

    if (DOM.filters.barber.value && DOM.filters.barber.value !== "all") {
      filteredAppointments = filteredAppointments.filter(a => a.barber_id === DOM.filters.barber.value);
    }

    if (DOM.filters.service.value && DOM.filters.service.value !== "all") {
      filteredAppointments = filteredAppointments.filter(a => a.service.some(s => s.id === DOM.filters.service.value));
    }

    if (DOM.filters.startDate.value) {
      const startDate = new Date(DOM.filters.startDate.value);
      startDate.setHours(0, 0, 0, 0);
      filteredAppointments = filteredAppointments.filter(a => new Date(a.date) >= startDate);
    }

    if (DOM.filters.endDate.value) {
      const endDate = new Date(DOM.filters.endDate.value);
      endDate.setHours(23, 59, 59, 999);
      filteredAppointments = filteredAppointments.filter(a => new Date(a.date) <= endDate);
    }

    if (DOM.filters.sortColumn.value) {
      const sortColumn = DOM.filters.sortColumn.value;
      const sortOrder = DOM.filters.sortOrder.value;

      filteredAppointments.sort((a, b) => {
        let valueA, valueB;

        switch (sortColumn) {
          case "date": valueA = new Date(a.date); valueB = new Date(b.date); break;
          case "client_name": valueA = a.client_name.toLowerCase(); valueB = b.client_name.toLowerCase(); break;
          case "barber_name": valueA = a.barber_name.toLowerCase(); valueB = b.barber_name.toLowerCase(); break;
          case "service": valueA = a.service[0].toLowerCase(); valueB = b.service[0].toLowerCase(); break;
          default: valueA = new Date(a.date); valueB = new Date(b.date);
        }

        return sortOrder === "asc" ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
      });
    }

    return filteredAppointments;
  }

  function updatePaginationState(totalItems, page) {
    state.totalItems = totalItems;
    state.totalPages = Math.ceil(totalItems / state.itemsPerPage);
    state.currentPage = page > state.totalPages ? 1 : page;
    updateResultsCount(Math.min(state.itemsPerPage, totalItems - (state.currentPage - 1) * state.itemsPerPage), totalItems);
    updatePaginationControls();
  }

  function renderSimulatedAppointments(appointments, page) {
    const startIndex = (page - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const paginatedAppointments = appointments.slice(startIndex, endIndex);

    paginatedAppointments.forEach(appointment => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${new Date(appointment.date).toLocaleString("pt-BR")}</td>
        <td>${appointment.client_name}</td>
        <td>${appointment.service.join(", ")}</td>
        <td>${appointment.barber_name}</td>
        <td class="status-${appointment.status}">${appointment.status}</td>
        <td>
          ${appointment.status === "scheduled"
          ? `<button class="btn btn-confirm confirm-btn" data-id="${appointment._id}">Confirmar</button>
               <button class="btn btn-secondary cancel-btn" data-id="${appointment._id}">Cancelar</button>`
          : appointment.status === "canceled"
            ? `<button class="btn btn-secondary delete-btn" data-id="${appointment._id}">Deletar</button>`
            : "-"
        }
        </td>
      `;
      DOM.table.body.appendChild(row);
    });

    document.querySelectorAll(".confirm-btn").forEach(button => {
      button.addEventListener("click", () => showConfirmationModal(button, "confirmed"));
    });

    document.querySelectorAll(".cancel-btn").forEach(button => {
      button.addEventListener("click", () => showConfirmationModal(button, "canceled"));
    });

    document.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", () => showConfirmationModal(button, "delete"));
    });
  }

  // 10. Funções para cadastro de administrador
  function setupAdminRegistration() {
    DOM.addAdminBtn.addEventListener("click", () => {
      DOM.modals.adminRegistration.style.display = "flex";
      DOM.modals.adminMessage.textContent = "";
    });

    DOM.modals.cancelAdmin.addEventListener("click", () => {
      DOM.modals.adminRegistration.style.display = "none";
      DOM.modals.adminForm.reset();
      DOM.modals.adminMessage.textContent = "";
    });

    DOM.modals.adminRegistration.addEventListener("click", (e) => {
      if (e.target === DOM.modals.adminRegistration) {
        DOM.modals.adminRegistration.style.display = "none";
        DOM.modals.adminForm.reset();
        DOM.modals.adminMessage.textContent = "";
      }
    });

    DOM.modals.adminForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = DOM.adminFormFields.name.value.trim();
      const email = DOM.adminFormFields.email.value.trim();
      const password = DOM.adminFormFields.password.value;

      if (!name || !email || !password) {
        DOM.modals.adminMessage.textContent = "Todos os campos são obrigatórios.";
        DOM.modals.adminMessage.style.color = "#dc3545";
        return;
      }

      try {
        DOM.modals.adminMessage.textContent = "Cadastrando administrador...";
        DOM.modals.adminMessage.style.color = "#007bff";

        const response = await fetchWithErrorHandling(`${window.env.API_URL}api/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, nivel: 1 }),
        });

        if (!response.error) {
          DOM.modals.adminMessage.textContent = "Administrador cadastrado com sucesso!";
          DOM.modals.adminMessage.style.color = "#28a745";
          DOM.modals.adminForm.reset();

          setTimeout(() => {
            DOM.modals.adminRegistration.style.display = "none";
            DOM.modals.adminMessage.textContent = "";
          }, 1000);
        } else {
          DOM.modals.adminMessage.textContent = response.errors ? response.errors[0].msg : response.message || "Erro ao cadastrar administrador.";
          DOM.modals.adminMessage.style.color = "#dc3545";
        }
      } catch (error) {
        console.error("Erro ao cadastrar administrador:", error);
        DOM.modals.adminMessage.textContent = "Erro de conexão. Tente novamente.";
        DOM.modals.adminMessage.style.color = "#dc3545";
      }
    });
  }

  // 11 .Edição de usuário

  // Função para abrir o modal de edição de usuário
  async function openUserEditModal(userId) {
    try {
      // Buscar os dados do usuário
      const user = await fetchWithErrorHandling(`${window.env.API_URL}api/usuarios/${userId}`,{
        headers : {"access-token" : tokenExample}
      });

      // Preencher o formulário com os dados do usuário
      document.getElementById("userEditName").value = user.name;
      document.getElementById("userEditEmail").value = user.email;

      // Limpar campos de senha e mensagens
      document.getElementById("userEditCurrentPassword").value = "";
      document.getElementById("userEditNewPassword").value = "";
      document.getElementById("userEditConfirmPassword").value = "";
      document.getElementById("userEditMessage").textContent = "";

      // Exibir o modal
      document.getElementById("userEditModal").style.display = "flex";
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      alert("Não foi possível carregar os dados do usuário. Tente novamente.");
    }
  }

  // Função para configurar o modal de edição de usuário
  function setupUserEditModal() {
    const userEditModal = document.getElementById("userEditModal");
    const userEditForm = document.getElementById("userEditForm");
    const cancelUserEdit = document.getElementById("cancelUserEdit");
    const userEditMessage = document.getElementById("userEditMessage");

    // Fechar modal ao clicar no botão cancelar
    cancelUserEdit.addEventListener("click", () => {
      userEditModal.style.display = "none";
      userEditMessage.textContent = "";
    });

    // Fechar modal ao clicar fora do conteúdo
    userEditModal.addEventListener("click", (e) => {
      if (e.target === userEditModal) {
        userEditModal.style.display = "none";
        userEditMessage.textContent = "";
      }
    });

    // Lidar com o envio do formulário
    userEditForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const currentUser = JSON.parse(localStorage.getItem("user"));
      const name = document.getElementById("userEditName").value.trim();
      const email = document.getElementById("userEditEmail").value.trim();
      const password = document.getElementById("userEditCurrentPassword").value;
      const newPassword = document.getElementById("userEditNewPassword").value;
      const confirmPassword = document.getElementById("userEditConfirmPassword").value;

      // Validações básicas
      if (!name || !email || !password) {
        userEditMessage.textContent = "Nome, email e senha atual são obrigatórios.";
        userEditMessage.style.color = "#dc3545";
        return;
      }

      if (newPassword && newPassword !== confirmPassword) {
        userEditMessage.textContent = "As novas senhas não coincidem.";
        toastNotification({ error: true, message: "As novas senhas não coincidem." })
        userEditMessage.style.color = "#dc3545";
        return;
      }

      try {
        userEditMessage.textContent = "Atualizando dados...";
        userEditMessage.style.color = "#007bff";

        // Preparar dados para atualização
        const updateData = {
          name,
          email,
          password
        };

        if (newPassword) {
          updateData.newPassword = newPassword;
        }

        // Chamar API para atualizar usuário
        const response = await fetchWithErrorHandling(`${window.env.API_URL}api/usuarios/${currentUser._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "access-token" : tokenExample},
          body: JSON.stringify(updateData)
        });

        if (response.error) {
          userEditMessage.textContent = response.errors ? response.errors[0].msg : response.message || "Erro ao atualizar dados.";
          userEditMessage.style.color = "#dc3545";
        } else {
          // Atualizar dados no localStorage
          const updatedUser = { ...currentUser, name, email };
          localStorage.setItem("user", JSON.stringify(updatedUser));

          // Atualizar nome exibido no dashboard
          document.getElementById("adminName").textContent = name;

          userEditMessage.textContent = "Dados atualizados com sucesso!";
          userEditMessage.style.color = "#28a745";

          // Fechar modal após 2 segundos
          setTimeout(() => {
            userEditModal.style.display = "none";
            userEditMessage.textContent = "";
          }, 1000);
        }
      } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        userEditMessage.textContent = "Erro ao atualizar dados. Tente novamente.";
        userEditMessage.style.color = "#dc3545";
      }
    });

    // Configurar botão de excluir conta
    setupUserDeleteButton();
  }

  // 12. Exclusão de perfil

  function setupUserDeleteButton() {
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmationMessage = document.getElementById('confirmationMessage');

    deleteAccountBtn.addEventListener('click', () => {
      // Armazena a ação pendente no state
      state.pendingAction = {
        action: "deleteAccount",
        button: deleteAccountBtn
      };

      // Configurar o modal de confirmação
      confirmationMessage.textContent = "Tem certeza que deseja excluir sua conta permanentemente? Esta ação não pode ser desfeita.";
      confirmationModal.style.display = "flex";

      // Remove todos os listeners antigos
      DOM.modals.confirmAction.onclick = null;
      DOM.modals.cancelAction.onclick = null;

      // Adicionar novos listeners
      DOM.modals.confirmAction.addEventListener('click', executePendingAction);
      DOM.modals.cancelAction.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
        state.pendingAction = null;
      });
    });
  }

  // 13. Configuração de event listeners
  function setupEventListeners() {
    // Filtros
    DOM.filters.status.addEventListener("change", () => loadStats(1));
    DOM.filters.clientName.addEventListener("keyup", (e) => e.key === "Enter" && loadStats(1));
    DOM.filters.barber.addEventListener("change", () => loadStats(1));
    DOM.filters.service.addEventListener("change", () => loadStats(1));
    DOM.filters.sortOrder.addEventListener("change", () => loadStats(1));
    DOM.filters.sortColumn.addEventListener("change", () => loadStats(1));
    DOM.filters.startDate.addEventListener("change", syncDates);
    DOM.filters.endDate.addEventListener("change", syncDates);
    DOM.filters.singleDay.addEventListener("change", function () {
      if (this.checked && DOM.filters.startDate.value) {
        DOM.filters.endDate.value = DOM.filters.startDate.value;
      } else if (this.checked && DOM.filters.endDate.value) {
        DOM.filters.startDate.value = DOM.filters.endDate.value;
      }
    });

    // Botões
    DOM.buttons.today.addEventListener("click", () => {
      setToday();
      loadStats(1);
    });
    DOM.buttons.refresh.addEventListener("click", () => loadStats(state.currentPage));
    DOM.buttons.clearFilters.addEventListener("click", clearFilters);
    DOM.buttons.prevPage.addEventListener("click", () => state.currentPage > 1 && loadStats(state.currentPage - 1));
    DOM.buttons.nextPage.addEventListener("click", () => state.currentPage < state.totalPages && loadStats(state.currentPage + 1));

    // Paginação
    DOM.table.itemsPerPage.addEventListener("change", () => loadStats(1));

    // Admin registration
    setupAdminRegistration();
  }

  // 12. Inicialização
  loadStats(1);
  setupEventListeners();
}

// Inicializar o módulo
if (document.querySelector(".admin-dashboard-container")) initializeAdminDashboard();