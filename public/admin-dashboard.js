// admin-dashboard.js
import { fetchWithErrorHandling } from "./script.js"

const apiUrl = "https://barbearia-mongo-db-liart.vercel.app/"
// Módulo do Dashboard de Administrador
function initializeAdminDashboard() {
  console.log(apiUrl)
  const currentUser = JSON.parse(localStorage.getItem("user"))
  if (!currentUser || !currentUser.isAdmin) window.location.href = "login.html"

  // Configurar informações do administrador
  document.getElementById("adminName").textContent = currentUser.name
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("user")
    window.location.href = "index.html"
  })

  // Elementos do DOM
  const statusFilter = document.getElementById("statusFilter")
  const clientNameInput = document.getElementById("clientNameInput")
  const barberSelect = document.getElementById("barberSelect")
  const serviceSelect = document.getElementById("serviceSelect")
  const startDateFilter = document.getElementById("startDateFilter")
  const endDateFilter = document.getElementById("endDateFilter")
  const singleDayFilter = document.getElementById("singleDayFilter")
  const sortOrderSelect = document.getElementById("sortOrderSelect")
  const sortColumnSelect = document.getElementById("sortColumnSelect")
  const todayBtn = document.getElementById("todayBtn")
  const refreshBtn = document.getElementById("refreshBtn")
  const clearFiltersBtn = document.getElementById("clearFiltersBtn")
  const loadingMessage = document.getElementById("loadingMessage")
  const tableBody = document.getElementById("appointmentsTableBody")
  const resultsCount = document.getElementById("resultsCount")
  const prevPageBtn = document.getElementById("prevPageBtn")
  const nextPageBtn = document.getElementById("nextPageBtn")
  const paginationNumbers = document.getElementById("paginationNumbers")
  const itemsPerPageSelect = document.getElementById("itemsPerPage")
  const confirmationModal = document.getElementById("confirmationModal")
  const confirmationMessage = document.getElementById("confirmationMessage")
  const confirmActionBtn = document.getElementById("confirmActionBtn")
  const cancelActionBtn = document.getElementById("cancelActionBtn")

  // Estado da paginação
  let currentPage = 1
  let totalPages = 1
  let itemsPerPage = Number.parseInt(itemsPerPageSelect.value)
  let totalItems = 0

  // Simulação de agendamentos (usando os mesmos dados simulados do dashboard de cliente)
  const simulatedAppointments = JSON.parse(localStorage.getItem("simulatedAppointments")) || []

  // Função para carregar estatísticas e agendamentos
  async function loadStats(page = 1) {
    loadingMessage.style.display = "block"
    tableBody.innerHTML = "" // Limpar tabela enquanto carrega
    currentPage = page

    try {
      // Atualizar o número de itens por página
      itemsPerPage = Number.parseInt(itemsPerPageSelect.value)

      // Montar filtros
      const filters = {
        page: page,
        limit: itemsPerPage,
      }

      // Pegando valores dos inputs/selects
      if (statusFilter.value && statusFilter.value !== "all") {
        filters.status = statusFilter.value
      }

      // Adicionar filtro de nome do cliente
      if (clientNameInput.value.trim()) {
        filters.client_name = clientNameInput.value.trim()
      }

      // Adicionar filtro de barbeiro
      if (barberSelect.value && barberSelect.value !== "all") {
        filters.barber_name = barberSelect.value
      }

      // Adicionar filtro de serviço
      if (serviceSelect.value && serviceSelect.value !== "all") {
        filters.service = serviceSelect.value
      }

      // Adicionar filtro de data
      if (startDateFilter.value) {
        filters.start_date = startDateFilter.value
      }

      if (endDateFilter.value) {
        filters.end_date = endDateFilter.value
      }

      // Adicionar ordenação
      if (sortColumnSelect.value) {
        filters.sort = sortColumnSelect.value
        filters.order = sortOrderSelect.value
      }

      // Montar query string com URLSearchParams
      const queryString = new URLSearchParams(filters).toString()
      const appointmentsUrl = `${apiUrl}api/agendamentos${queryString ? "?" + queryString : ""}`

      console.log(appointmentsUrl) // conferindo a URL final

      const appointments = await fetchWithErrorHandling(appointmentsUrl)

      // Carregar opções de barbeiros e serviços se ainda não foram carregadas
      if (barberSelect.options.length <= 1) {
        // Código para carregar barbeiros
        // await loadBarbers();
      }

      if (serviceSelect.options.length <= 1) {
        // Código para carregar serviços
        // await loadServices();
      }

      // Atualizar estatísticas
      const totalAppointments = await fetchWithErrorHandling(`${apiUrl}api/agendamentos/total`)
      document.getElementById("totalAppointments").textContent = totalAppointments.count

      // Atualizar informações de paginação
      totalItems = appointments.pagination.total
      totalPages = appointments.pagination.pages
      currentPage = appointments.pagination.page
      itemsPerPage = appointments.pagination.limit

      // Atualizar contador de resultados
      updateResultsCount(appointments.data.length, totalItems)

      // Atualizar controles de paginação
      updatePaginationControls()

      const statusLabels = {
        canceled: "Cancelado",
        confirmed: "Confirmado",
        scheduled: "Agendado",
      }

      // Carregar agendamentos na tabela
      appointments.data.forEach((appointment) => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${new Date(appointment.date).toLocaleString("pt-BR")}</td>
          <td>${appointment.client_name}</td>
          <td>${appointment.services.map((service) => service.name).join(", ")}</td>
          <td>${appointment.barber_name}</td>
          <td>${appointment.total_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
          <td class='status-${appointment.status}'>${statusLabels[appointment.status] || appointment.status}</td>
          <td class='appointments-table-actions'>
            ${
              appointment.status === "scheduled"
                ? `<button class="btn btn-confirm confirm-btn" data-id="${appointment._id}">Confirmar</button>
                   <button class="btn btn-secondary cancel-btn" data-id="${appointment._id}">Cancelar</button>`
                : appointment.status === "canceled"
                  ? `<button class="btn btn-secondary delete-btn" data-id="${appointment._id}">Deletar</button>`
                  : "-"
            }
          </td>
        `
        tableBody.appendChild(row)
      })

      // Adicionar eventos aos botões de confirmar
      document.querySelectorAll(".confirm-btn").forEach((button) => {
        button.addEventListener("click", () => showConfirmationModal(button, "confirmed"))
      })

      // Adicionar eventos aos botões de cancelar
      document.querySelectorAll(".cancel-btn").forEach((button) => {
        button.addEventListener("click", () => showConfirmationModal(button, "canceled"))
      })

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", () => showConfirmationModal(button, "delete"))
      })
    } catch (error) {
      console.log("Não foi possível exibir dados da API " + error)
      // Se o backend não estiver disponível, usar a simulação
      loadStatsSimulated(page)
    } finally {
      loadingMessage.style.display = "none"
    }
  }

  // Definindo a função separadamente
function handleConfirmClick(appointmentId, action, button) {
  confirmationModal.style.display = "none";
  if (action === "delete") {
    deleteAppointment(appointmentId, button);
  } else {
    updateAppointmentStatus(appointmentId, action, button);
  }
}

function showConfirmationModal(button, action) {
  const appointmentId = button.getAttribute("data-id");
  let message = "";

  switch (action) {
    case "confirmed":
      message = "Deseja confirmar este agendamento?";
      break;
    case "canceled":
      message = "Deseja cancelar este agendamento?";
      break;
    case "delete":
      message = "Deseja excluir este agendamento permanentemente?";
      break;
  }

  confirmationMessage.textContent = message;
  confirmationModal.style.display = "flex";

  // Remove todos os listeners antigos (criando botão novo)
  confirmActionBtn.replaceWith(confirmActionBtn.cloneNode(true));
  cancelActionBtn.replaceWith(cancelActionBtn.cloneNode(true));

  // Atualizar as referências depois de clonar
  const newConfirmBtn = document.getElementById("confirmActionBtn");
  const newCancelBtn = document.getElementById("cancelActionBtn");

  newConfirmBtn.addEventListener("click", () => handleConfirmClick(appointmentId, action, button));
  newCancelBtn.addEventListener("click", () => confirmationModal.style.display = "none");
}

  

  // Função para atualizar o status do agendamento
  async function updateAppointmentStatus(appointmentId, statusValue, button) {
    const row = button.closest("tr")

    const action = statusValue == "canceled" ? "cancelar" : "confirmar"
    const statusTextContent = statusValue == "canceled" ? "Cancelado" : "Confirmado"

    try {
      row.style.opacity = "0.7" // Feedback visual
      await fetchWithErrorHandling(`${apiUrl}api/agendamentos/${appointmentId}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      })

      // Atualização direta do DOM (sem recarregar tudo)
      row.cells[5].textContent = statusTextContent // Status
      row.cells[5].classList.remove(`status-scheduled`)
      row.cells[5].classList.add(`status-${statusValue}`)
      row.cells[6].innerHTML = "-" // Ações
    } catch (error) {
      console.error(`Falha ao ${action}:`, error)
      // Rollback visual se necessário
      row.style.opacity = "1"
    }
  }

  // Função para deletar um agendamento
  async function deleteAppointment(appointmentId, button) {
    const row = button.closest("tr")
    try {
      row.style.opacity = "0.4" // Feedback visual
      await fetchWithErrorHandling(`${apiUrl}api/agendamentos/${appointmentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      // Remover a linha da tabela após exclusão bem-sucedida
      row.remove()

      // Atualizar contador
      updateResultsCount(document.querySelectorAll("#appointmentsTableBody tr").length, totalItems - 1)
      const totalAppointments = await fetchWithErrorHandling(`${apiUrl}api/agendamentos/total`)
      document.getElementById("totalAppointments").textContent = totalAppointments.count
    } catch (error) {
      console.error(`Falha ao deletar:`, error)
      // Rollback visual se necessário
      row.style.opacity = "1"
    }
  }

  // Função para carregar estatísticas e agendamentos simulados
  function loadStatsSimulated(page = 1) {
    loadingMessage.style.display = "block"
    tableBody.innerHTML = "" // Limpar tabela enquanto carrega

    // Atualizar o número de itens por página
    itemsPerPage = Number.parseInt(itemsPerPageSelect.value)

    // Simulação de clientes (apenas para exibir algo nas estatísticas)
    const simulatedClients = JSON.parse(localStorage.getItem("simulatedClients")) || [{ name: currentUser.name }]

    // Atualizar estatísticas
    document.getElementById("totalAppointments").textContent = simulatedAppointments.length
    document.getElementById("totalClients").textContent = simulatedClients.length

    // Aplicar filtros aos dados simulados
    let filteredAppointments = [...simulatedAppointments]

    // Filtrar por status
    const selectedStatus = statusFilter.value
    if (selectedStatus !== "all") {
      filteredAppointments = filteredAppointments.filter((appointment) => appointment.status === selectedStatus)
    }

    // Filtrar por nome do cliente
    if (clientNameInput.value.trim()) {
      const searchTerm = clientNameInput.value.trim().toLowerCase()
      filteredAppointments = filteredAppointments.filter((appointment) =>
        appointment.client_name.toLowerCase().includes(searchTerm),
      )
    }

    // Filtrar por barbeiro
    if (barberSelect.value && barberSelect.value !== "all") {
      filteredAppointments = filteredAppointments.filter((appointment) => appointment.barber_id === barberSelect.value)
    }

    // Filtrar por serviço
    if (serviceSelect.value && serviceSelect.value !== "all") {
      filteredAppointments = filteredAppointments.filter((appointment) =>
        appointment.service.some((service) => service.id === serviceSelect.value),
      )
    }

    // Filtrar por data
    if (startDateFilter.value) {
      const startDate = new Date(startDateFilter.value)
      startDate.setHours(0, 0, 0, 0)

      filteredAppointments = filteredAppointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.date)
        return appointmentDate >= startDate
      })
    }

    if (endDateFilter.value) {
      const endDate = new Date(endDateFilter.value)
      endDate.setHours(23, 59, 59, 999)

      filteredAppointments = filteredAppointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.date)
        return appointmentDate <= endDate
      })
    }

    // Aplicar ordenação
    if (sortColumnSelect.value) {
      const sortColumn = sortColumnSelect.value
      const sortOrder = sortOrderSelect.value

      filteredAppointments.sort((a, b) => {
        let valueA, valueB

        switch (sortColumn) {
          case "date":
            valueA = new Date(a.date)
            valueB = new Date(b.date)
            break
          case "client_name":
            valueA = a.client_name.toLowerCase()
            valueB = b.client_name.toLowerCase()
            break
          case "barber_name":
            valueA = a.barber_name.toLowerCase()
            valueB = b.barber_name.toLowerCase()
            break
          case "service":
            valueA = a.service[0].toLowerCase()
            valueB = b.service[0].toLowerCase()
            break
          default:
            valueA = new Date(a.date)
            valueB = new Date(b.date)
        }

        if (sortOrder === "asc") {
          return valueA > valueB ? 1 : -1
        } else {
          return valueA < valueB ? 1 : -1
        }
      })
    }

    // Atualizar informações de paginação para simulação
    totalItems = filteredAppointments.length
    totalPages = Math.ceil(totalItems / itemsPerPage)
    currentPage = page > totalPages ? 1 : page

    // Aplicar paginação aos dados simulados
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex)

    // Atualizar contador de resultados
    updateResultsCount(paginatedAppointments.length, totalItems)

    // Atualizar controles de paginação
    updatePaginationControls()

    // Carregar agendamentos na tabela
    paginatedAppointments.forEach((appointment) => {
      const row = document.createElement("tr")
      row.innerHTML = `
        <td>${new Date(appointment.date).toLocaleString("pt-BR")}</td>
        <td>${appointment.client_name}</td>
        <td>${appointment.service.join(", ")}</td>
        <td>${appointment.barber_name}</td>
        <td class="status-${appointment.status}">${appointment.status}</td>
        <td>
          ${
            appointment.status === "scheduled"
              ? `<button class="btn btn-confirm confirm-btn" data-id="${appointment._id}">Confirmar</button>
                 <button class="btn btn-secondary cancel-btn" data-id="${appointment._id}">Cancelar</button>`
              : appointment.status === "canceled"
                ? `<button class="btn btn-secondary delete-btn" data-id="${appointment._id}">Deletar</button>`
                : "-"
          }
        </td>
      `
      tableBody.appendChild(row)
    })

    // Adicionar eventos aos botões de confirmar
    document.querySelectorAll(".confirm-btn").forEach((button) => {
      button.addEventListener("click", () => showConfirmationModal(button, "confirmed"))
    })

    // Adicionar eventos aos botões de cancelar
    document.querySelectorAll(".cancel-btn").forEach((button) => {
      button.addEventListener("click", () => showConfirmationModal(button, "canceled"))
    })

    // Adicionar eventos aos botões de deletar
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", () => showConfirmationModal(button, "delete"))
    })

    loadingMessage.style.display = "none"
  }

  // Função para atualizar o contador de resultados
  function updateResultsCount(currentCount, totalCount) {
    resultsCount.textContent = `Exibindo ${currentCount} de ${totalCount} agendamentos`
  }

  // Função para atualizar os controles de paginação
  function updatePaginationControls() {
    // Atualizar botões de navegação
    prevPageBtn.disabled = currentPage <= 1
    nextPageBtn.disabled = currentPage >= totalPages

    // Limpar e recriar números de página
    paginationNumbers.innerHTML = ""

    // Se não houver páginas, não mostrar paginação
    if (totalPages <= 0) {
      return
    }

    // Determinar quais números de página mostrar
    let startPage = Math.max(1, currentPage - 2)
    const endPage = Math.min(totalPages, startPage + 4)

    // Ajustar se estamos perto do final
    if (endPage - startPage < 4 && startPage > 1) {
      startPage = Math.max(1, endPage - 4)
    }

    // Adicionar primeira página se não estiver incluída
    if (startPage > 1) {
      addPageNumber(1)
      if (startPage > 2) {
        addEllipsis()
      }
    }

    // Adicionar números de página
    for (let i = startPage; i <= endPage; i++) {
      addPageNumber(i)
    }

    // Adicionar última página se não estiver incluída
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        addEllipsis()
      }
      addPageNumber(totalPages)
    }
  }

  // Função para adicionar um número de página
  function addPageNumber(pageNum) {
    const pageElement = document.createElement("div")
    pageElement.className = `page-number ${pageNum === currentPage ? "active" : ""}`
    pageElement.textContent = pageNum
    pageElement.addEventListener("click", () => {
      if (pageNum !== currentPage) {
        loadStats(pageNum)
      }
    })
    paginationNumbers.appendChild(pageElement)
  }

  // Função para adicionar reticências na paginação
  function addEllipsis() {
    const ellipsis = document.createElement("div")
    ellipsis.className = "page-number"
    ellipsis.textContent = "..."
    ellipsis.style.cursor = "default"
    paginationNumbers.appendChild(ellipsis)
  }

  // Função para limpar todos os filtros
  function clearFilters() {
    statusFilter.value = "all"
    clientNameInput.value = ""
    barberSelect.value = "all"
    serviceSelect.value = "all"
    startDateFilter.value = ""
    endDateFilter.value = ""
    singleDayFilter.checked = false
    sortOrderSelect.value = "asc"
    sortColumnSelect.value = "date"
    loadStats(1)
  }

  // Função para definir a data de hoje
  function setToday() {
    const today = new Date().toISOString().split("T")[0]
    startDateFilter.value = today
    endDateFilter.value = today
    singleDayFilter.checked = true
  }

  // Função para sincronizar datas quando o filtro de dia único está ativado
  function syncDates() {
    if (singleDayFilter.checked) {
      if (this === startDateFilter) {
        endDateFilter.value = startDateFilter.value
      } else {
        startDateFilter.value = endDateFilter.value
      }
    }
    loadStats()
  }

  // Carregar dados inicialmente
  loadStats(1)

  // Adicionar eventos aos filtros
  statusFilter.addEventListener("change", () => loadStats(1))
  clientNameInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") loadStats(1)
  })
  barberSelect.addEventListener("change", () => loadStats(1))
  serviceSelect.addEventListener("change", () => loadStats(1))
  sortOrderSelect.addEventListener("change", () => loadStats(1))
  sortColumnSelect.addEventListener("change", () => loadStats(1))

  startDateFilter.addEventListener("change", syncDates)
  endDateFilter.addEventListener("change", syncDates)

  singleDayFilter.addEventListener("change", function () {
    if (this.checked && startDateFilter.value) {
      endDateFilter.value = startDateFilter.value
    } else if (this.checked && endDateFilter.value) {
      startDateFilter.value = endDateFilter.value
    }
  })

  todayBtn.addEventListener("click", () => {
    setToday()
    loadStats(1)
  })

  // Adicionar evento ao seletor de itens por página
  itemsPerPageSelect.addEventListener("change", () => {
    // Ao mudar o número de itens por página, voltar para a primeira página
    loadStats(1)
  })

  // Adicionar evento ao botão de recarregar
  refreshBtn.addEventListener("click", () => loadStats(currentPage))

  // Adicionar evento ao botão de limpar filtros
  clearFiltersBtn.addEventListener("click", clearFilters)

  // Adicionar eventos aos botões de paginação
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      loadStats(currentPage - 1)
    }
  })

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      loadStats(currentPage + 1)
    }
  })
}

// Inicializar o módulo
if (document.querySelector(".admin-dashboard-container")) initializeAdminDashboard()
