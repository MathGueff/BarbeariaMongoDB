// dashboard.js
import { fetchWithErrorHandling, toastNotification, tokenValidator } from "./script.js";


// Módulo do Dashboard de Cliente
async function initializeDashboard() {
  // 1. Verificação de autenticação e configuração inicial
  const token = localStorage.getItem('token')

  if(!token) { window.location.href = 'login.html';return;}

  const currentUser = await fetchWithErrorHandling(`${window.env.API_URL}api/usuarios`, {
    headers : {access_token : token}
  }, false)

  if (!currentUser || currentUser.error || currentUser.nivel !== 0){ window.location.href = "login.html"; return}

  // Configurar informações do usuário
  document.getElementById("userName").textContent = "Bem vindo " + currentUser.name + "!"
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("user")
    window.location.href = "login.html"
  })

  const toastData = JSON.parse(sessionStorage.getItem('authMsg'));
    if (toastData) {
      toastNotification(toastData)
      sessionStorage.removeItem("authMsg"); // limpa depois de usar
    }

  // 2. Seleção de elementos DOM
  const DOM = {
    user: {
      name: document.getElementById("userName"),
      logoutBtn: document.getElementById("logoutBtn"),
      editBtn: document.getElementById("editUserBtn"),
    },
    scheduling: {
      form: document.getElementById("scheduleForm"),
      timeSelect: document.getElementById("timeSelect"),
      barberSelect: document.getElementById("barberSelect"),
      dateInput: document.getElementById("dateInput"),
      message: document.getElementById("scheduleMessage"),
      serviceCheckboxes: document.querySelectorAll(".service-checkbox"),
      totalPriceDisplay: document.getElementById("totalPriceDisplay"),
    },
    overview: {
      container: document.getElementById("appointmentOverview"),
      date: document.getElementById("appointmentDate"),
      time: document.getElementById("appointmentTime"),
      barber: document.getElementById("appointmentBarber"),
      service: document.getElementById("appointmentService"),
      price: document.getElementById("appointmentPrice"),
      status: document.getElementById("appointmentStatus"),
      cancelBtn: document.getElementById("cancelAppointmentBtn"),
      editBtn: document.getElementById("editAppointmentOverviewBtn"),
    },
    appointments: {
      tableBody: document.getElementById("clientAppointmentsTableBody"),
    },
    modals: {
      confirmation: document.getElementById("confirmationModal"),
      confirmationMessage: document.getElementById("confirmationMessage"),
      confirmAction: document.getElementById("confirmActionBtn"),
      cancelAction: document.getElementById("cancelActionBtn"),
      editAppointment: document.getElementById("editAppointmentModal"),
      editForm: document.getElementById("editAppointmentForm"),
      editBarberSelect: document.getElementById("editBarberSelect"),
      editDateInput: document.getElementById("editDateInput"),
      editTimeSelect: document.getElementById("editTimeSelect"),
      editTotalPrice: document.getElementById("editTotalPrice"),
      closeEditBtn: document.getElementById("closeEditModalBtn"),
      editServiceCheckboxes: document.querySelectorAll(".edit-service-checkbox"),
      userEdit: document.getElementById("userEditModal"),
      userEditForm: document.getElementById("userEditForm"),
      cancelUserEdit: document.getElementById("cancelUserEdit"),
      userEditMessage: document.getElementById("userEditMessage"),
      deleteAccountBtn: document.getElementById("deleteAccountBtn"),
      userDeleteMessage : document.getElementById('userDeleteMessage')
    },
  }

  // 3. Estado da aplicação
  const state = {
    pendingAction: null,
    lastAppointment: null,
    currentEditingAppointmentId: null,
    simulatedAppointments: JSON.parse(localStorage.getItem("simulatedAppointments")) || [],
  }

  // 4. Constantes auxiliares
  const statusLabels = {
    canceled: "Cancelado",
    confirmed: "Confirmado",
    scheduled: "Agendado",
  }

  // 5. Funções principais de inicialização
  function initializeComponents() {
    setupUserProfile()
    setupScheduling()
    setupAppointmentOverview()
    setupAppointmentsList()
    setupModals()

    // Carregar dados iniciais
    loadInitialData()
  }

  function loadInitialData() {
    displayLastAppointment()
    loadClientAppointments()
    populateTimeSlots()
    updateTotalPrice()
  }

  // 6. Configuração do perfil do usuário
  function setupUserProfile() {
    if (DOM.user.editBtn) {
      DOM.user.editBtn.addEventListener("click", () => {
        openUserEditModal(currentUser._id)
      })
    }
  }

  // 7. Sistema de agendamento
  function setupScheduling() {
    // Configurar eventos dos checkboxes de serviços
    DOM.scheduling.serviceCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", handleServiceSelection)
    })

    // Configurar eventos de mudança de data/barbeiro
    DOM.scheduling.dateInput.addEventListener("change", populateTimeSlots)
    DOM.scheduling.barberSelect.addEventListener("change", populateTimeSlots)

    // Configurar envio do formulário
    DOM.scheduling.form.addEventListener("submit", handleScheduleSubmit)
  }

  function handleServiceSelection() {
    const selectedServices = document.querySelectorAll(".service-checkbox:checked")

    if (selectedServices.length > 3 && this.checked) {
      this.checked = false
      alert("Você pode selecionar no máximo 3 serviços.")
      return
    }

    updateTotalPrice()
  }

  function calculateTotalPrice(checkboxes) {
    let total = 0
    let selectedCount = 0

    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        selectedCount++
        total += Number.parseFloat(checkbox.dataset.price)
      }
    })

    if (selectedCount > 3) {
      alert("Você pode selecionar no máximo 3 serviços.")
      return false
    }

    return total
  }

  function updateTotalPrice() {
    const total = calculateTotalPrice(DOM.scheduling.serviceCheckboxes)
    if (total !== false) {
      DOM.scheduling.totalPriceDisplay.textContent = total.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
      return true
    }
    return false
  }

  async function populateTimeSlots() {
    DOM.scheduling.timeSelect.innerHTML = ""
    const selectedDate = DOM.scheduling.dateInput.value
    const selectedBarber = DOM.scheduling.barberSelect.value

    if (!selectedDate || !selectedBarber) {
      DOM.scheduling.timeSelect.innerHTML = '<option value="">Selecione uma data e um barbeiro</option>'
      showScheduleMessage("Por favor, selecione uma data e um barbeiro para ver os horários disponíveis.", "error")
      return
    }

    clearScheduleMessage()

    try {
      const existingAppointments = await fetchExistingAppointments(selectedBarber, selectedDate)
      const occupiedTimes = extractOccupiedTimes(existingAppointments.data)
      populateAvailableTimeSlots(occupiedTimes)
    } catch (error) {
      console.error("Erro ao buscar horários:", error)
    }
  }

  async function fetchExistingAppointments(barber, date) {
    if (!barber || !date) return { data: [] }

    const url = `${window.env.API_URL}api/agendamentos?barber_name=${encodeURIComponent(barber)}&start_date=${date}&end_date=${date}&status=scheduled&status=confirmed`
    return await fetchWithErrorHandling(url, { headers: { 'access_token': token } })
  }

  function extractOccupiedTimes(appointments) {
    return appointments.map((appointment) => {
      const [, time] = appointment.date.split(" ")
      return time.slice(0, 5)
    })
  }

  function populateAvailableTimeSlots(occupiedTimes) {
    const selectedDate = DOM.scheduling.dateInput.value
    if(!selectedDate) return;
    const start = 8 * 60 // 8:00
    const end = 18 * 60 // 18:00
    const now = new Date();
    let hasAvailableSlots = false
    
    for (let i = start; i <= end; i += 30) {
      const hour = Math.floor(i / 60)
      const minute = i % 60
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`

      const dateStr = `${selectedDate}T${time}:00`;
      const date = new Date(dateStr);
      
      const isNotAvailable = date < now

      const isOccupied = occupiedTimes.includes(time)

      const option = document.createElement("option")
      option.value = time
      option.textContent = time

      if(isNotAvailable){
        option.disabled = true;
        option.textContent += " (Indisponível)"
      }
      else{
        if (isOccupied) {
          option.disabled = true
          option.textContent += " (Ocupado)"
        } else {
          hasAvailableSlots = true
        }
        DOM.scheduling.timeSelect.appendChild(option)
      }
    }

    if (!hasAvailableSlots) {
      DOM.scheduling.timeSelect.innerHTML = '<option value="">Nenhum horário disponível</option>'
      showScheduleMessage(
        `Nenhum horário disponível para ${DOM.scheduling.barberSelect.value} nesta data. Tente outro barbeiro ou outra data.`,
        "error",
      )
    }
  }

  async function handleScheduleSubmit(e) {
    e.preventDefault()

    const formData = extractScheduleFormData()
    if (!validateScheduleForm(formData)) return

    try {
      const response = await submitAppointment(formData)
      if(response.error){
        DOM.scheduling.message.innerHTML = response.errors ? response.errors[0].msg : response.message
      }
      else{
        handleScheduleSuccess()
      }
    } catch (error) {
      console.error("Erro ao agendar:", error)
      handleScheduleError(formData)
    }
  }

  function extractScheduleFormData() {
    const selectedServices = Array.from(DOM.scheduling.serviceCheckboxes).filter((cb) => cb.checked)

    return {
      barber: DOM.scheduling.barberSelect.value,
      date: DOM.scheduling.dateInput.value,
      time: DOM.scheduling.timeSelect.value,
      services: selectedServices.map((cb) => ({
        name: cb.dataset.name,
        price: Number.parseFloat(cb.dataset.price),
      })),
    }
  }

  function validateScheduleForm(formData) {
    if (formData.services.length === 0) {
      showScheduleMessage("Por favor, selecione pelo menos um serviço.", "error")
      return false
    }

    if (formData.services.length > 3) {
      showScheduleMessage("Você pode selecionar no máximo 3 serviços.", "error")
      return false
    }

    if (!formData.time) {
      showScheduleMessage("Por favor, selecione um horário disponível.", "error")
      return false
    }

    return true
  }

  async function submitAppointment(formData) {
    const agendamento = {
      client_name: currentUser.name,
      barber_name: formData.barber,
      services: formData.services,
      date: `${formData.date} ${formData.time}:00`,
    }

    return await fetchWithErrorHandling(`${window.env.API_URL}api/agendamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", 'access_token': token },
      body: JSON.stringify(agendamento),
    })
  }

  function handleScheduleSuccess() {
    showScheduleMessage("Agendamento realizado com sucesso!", "success")
    resetScheduleForm()
    refreshAppointmentData()
  }

  function handleScheduleError(formData) {
    // Simulação temporária para agendamento (se o backend não estiver disponível)
    const hasConflict = checkSimulatedConflict(formData)

    if (hasConflict) {
      showScheduleMessage(
        `O barbeiro ${formData.barber} já está ocupado neste horário. Por favor, escolha outro horário ou barbeiro.`,
        "error",
      )
      populateTimeSlots()
      return
    }
  }

  function checkSimulatedConflict(formData) {
    const appointmentDateTime = `${formData.date} ${formData.time}:00`
    return state.simulatedAppointments.some(
      (appointment) =>
        appointment.barber_name === formData.barber &&
        appointment.date === appointmentDateTime &&
        (appointment.status === "scheduled" || appointment.status === "confirmed"),
    )
  }

  function resetScheduleForm() {
    DOM.scheduling.serviceCheckboxes.forEach((checkbox) => {
      checkbox.checked = false
    })
    DOM.scheduling.dateInput.value = '';
    DOM.scheduling.timeSelect.value = '';
    updateTotalPrice()
  }

  function refreshAppointmentData() {
    displayLastAppointment()
    loadClientAppointments()
    populateTimeSlots()
  }

  function showScheduleMessage(message, type) {
    DOM.scheduling.message.textContent = message
    DOM.scheduling.message.style.color = type === "error" ? "#dc3545" : "#28a745"
  }

  function clearScheduleMessage() {
    DOM.scheduling.message.textContent = ""
  }

  // 8. Visão geral do último agendamento
  function setupAppointmentOverview() {
    if (DOM.overview.cancelBtn) {
      DOM.overview.cancelBtn.addEventListener("click", () => {
        if (!state.lastAppointment) {
          showScheduleMessage("Nenhum agendamento para cancelar.", "error")
          return
        }
        showConfirmationModal(state.lastAppointment._id, "cancel")
      })
    }

    if (DOM.overview.editBtn) {
      DOM.overview.editBtn.addEventListener("click", () => {
        if (state.lastAppointment && state.lastAppointment._id) {
          openEditModal(state.lastAppointment._id)
        } else {
          alert("Nenhum agendamento disponível para edição.")
        }
      })
    }
  }

  async function displayLastAppointment() {
    try {
      const response = await fetchWithErrorHandling(
        `${window.env.API_URL}api/agendamentos?client_name=${encodeURIComponent(currentUser.name)}
            &status=scheduled&status=confirmed&sort=date&order=desc`,
        {
          headers: { 'access_token': token }
        }
      )

      state.lastAppointment = response.data[0]
      renderLastAppointment()
    } catch (error) {
      console.error("Erro ao buscar último agendamento:", error)
      DOM.overview.container.style.display = "none"
    }
  }

  function renderLastAppointment() {
    if (!state.lastAppointment) {
      DOM.overview.container.style.display = "none"
      return
    }

    const isScheduled = state.lastAppointment.status === "scheduled"
    DOM.overview.cancelBtn.style.display = isScheduled ? "block" : "none"
    DOM.overview.editBtn.style.display = isScheduled ? "block" : "none"
    DOM.overview.container.style.display = "block"

    const [date, time] = state.lastAppointment.date.split(" ")
    DOM.overview.date.textContent = date.split("-").reverse().join("/")
    DOM.overview.time.textContent = time
    DOM.overview.barber.textContent = state.lastAppointment.barber_name
    DOM.overview.service.textContent = state.lastAppointment.services.map((service) => service.name).join(", ")
    DOM.overview.price.textContent = state.lastAppointment.total_price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
    DOM.overview.status.textContent = statusLabels[state.lastAppointment.status]
    DOM.overview.status.classList.add("status-" + state.lastAppointment.status)
  }

  // 9. Lista de agendamentos do cliente
  function setupAppointmentsList() {
    // Event delegation para botões dinâmicos
    document.addEventListener("click", handleAppointmentActions)
  }

  function handleAppointmentActions(e) {
    if (e.target.classList.contains("cancel-client-btn")) {
      const appointmentId = e.target.getAttribute("data-id")
      showConfirmationModal(appointmentId, "cancel")
    } else if (e.target.classList.contains("edit-client-btn")) {
      const appointmentId = e.target.getAttribute("data-id")
      openEditModal(appointmentId)
    }
  }

  async function getClientAppointments(name) {
    return await fetchWithErrorHandling(
      `${window.env.API_URL}api/agendamentos?client_name=${encodeURIComponent(name)}&status=scheduled&status=confirmed`, {
      headers: { 'access_token': token }
    }
    )
  }

  async function loadClientAppointments() {
    try {
      const appointments = await getClientAppointments(currentUser.name)
      if(appointments.error){
        tokenValidator(appointments)
        return;
      }
      renderClientAppointments(appointments.data)
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error)
      loadClientAppointmentsSimulated()
    }
  }


  function renderClientAppointments(appointments) {
    DOM.appointments.tableBody.innerHTML = ""

    appointments.forEach((appointment) => {
      const row = createAppointmentRow(appointment)
      DOM.appointments.tableBody.appendChild(row)
    })
  }

  function createAppointmentRow(appointment) {
    const [date, time] = appointment.date.split(" ")
    const row = document.createElement("tr")

    row.innerHTML = `
      <td>${date.split("-").reverse().join("/")}</td>
      <td>${time}</td>
      <td>${appointment.barber_name}</td>
      <td><ul><li>${appointment.services.map((service) => service.name).join("</li> <li>")}</ul></td>
      <td>${appointment.total_price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
      <td class='status-${appointment.status}'>${statusLabels[appointment.status] || appointment.status}</td>
      <td class='appointments-table-actions'>
        ${appointment.status === "scheduled"
        ? `<button class="btn btn-danger cancel-client-btn" data-id="${appointment._id}">Cancelar</button> 
             <button class="btn btn-edit edit-client-btn" data-id="${appointment._id}">Editar</button>`
        : "-"
      }
      </td>
    `

    return row
  }

  function loadClientAppointmentsSimulated() {
    const clientAppointments = state.simulatedAppointments.filter(
      (appointment) => appointment.client_name === currentUser.name,
    )
    renderSimulatedAppointments(clientAppointments)
  }

  function renderSimulatedAppointments(appointments) {
    DOM.appointments.tableBody.innerHTML = ""

    appointments.forEach((appointment) => {
      const row = createSimulatedAppointmentRow(appointment)
      DOM.appointments.tableBody.appendChild(row)
    })
  }

  function createSimulatedAppointmentRow(appointment) {
    const [date, time] = appointment.date.split(" ")
    const row = document.createElement("tr")

    row.innerHTML = `
      <td>${new Date(date).toLocaleDateString("pt-BR")}</td>
      <td>${time}</td>
      <td>${appointment.barber_name}</td>
      <td>${appointment.service ? appointment.service.join(", ") : "N/A"}</td>
      <td>${appointment.status}</td>
      <td>
        ${appointment.status === "scheduled"
        ? `<button class="btn btn-danger cancel-client-btn" data-id="${appointment._id}">Cancelar</button>`
        : "-"
      }
      </td>
    `

    return row
  }

  // 10. Sistema de modais
  function setupModals() {
    setupConfirmationModal()
    setupEditAppointmentModal()
    setupUserEditModal()
  }

  function setupConfirmationModal() {
    DOM.modals.cancelAction.addEventListener("click", () => {
      DOM.modals.confirmation.style.display = "none"
      state.pendingAction = null
    })
  }

  function showConfirmationModal(appointmentId, action) {
    let message = ""

    switch (action) {
      case "cancel":
        message = "Tem certeza que deseja cancelar este agendamento?"
        break
      case "deleteAccount":
        message = "Tem certeza que deseja excluir sua conta permanentemente? Esta ação não pode ser desfeita."
        break
    }

    state.pendingAction = { id: appointmentId, action }
    DOM.modals.confirmationMessage.textContent = message
    DOM.modals.confirmation.style.display = "flex"

    // Remover listeners antigos
    DOM.modals.confirmAction.onclick = null
    DOM.modals.cancelAction.onclick = null

    // Adicionar novos listeners
    DOM.modals.confirmAction.addEventListener("click", executePendingAction)
    DOM.modals.cancelAction.addEventListener("click", () => {
      DOM.modals.confirmation.style.display = "none"
      state.pendingAction = null
    })
  }

  async function executePendingAction() {
    if (!state.pendingAction) return

    const { id, action } = state.pendingAction
    DOM.modals.confirmation.style.display = "none"

    try {
      if (action === "cancel") {
        await cancelAppointment(id)
      } else if (action === "deleteAccount") {
        await deleteUserAccount()
      }
    } catch (error) {
      console.error("Erro ao executar ação:", error)
    } finally {
      state.pendingAction = null
    }
  }

  async function cancelAppointment(appointmentId) {
    try {
      await fetchWithErrorHandling(`${window.env.API_URL}api/agendamentos/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", 'access_token': token },
        body: JSON.stringify({ status: 'canceled' })
      })

      handleCancelSuccess(appointmentId)
    } catch (error) {
      handleCancelSimulated(appointmentId)
    }
  }

  function handleCancelSuccess(appointmentId) {
    if (state.lastAppointment && appointmentId === state.lastAppointment._id) {
      DOM.overview.status.classList.remove(`status-${state.lastAppointment.status}`)
      state.lastAppointment = null
      displayLastAppointment()
    }

    showScheduleMessage("Agendamento cancelado com sucesso!", "success")
    refreshAppointmentData()
  }

  function handleCancelSimulated(appointmentId) {
    state.simulatedAppointments = state.simulatedAppointments.map((appointment) => {
      if (appointment._id === appointmentId) {
        return { ...appointment, status: "canceled", updated_at: new Date().toISOString() }
      }
      return appointment
    })

    localStorage.setItem("simulatedAppointments", JSON.stringify(state.simulatedAppointments))

    if (state.lastAppointment && appointmentId === state.lastAppointment._id) {
      state.lastAppointment = null
      displayLastAppointment()
    }

    showScheduleMessage("Agendamento cancelado com sucesso (simulação).", "success")
    loadClientAppointmentsSimulated()
    populateTimeSlots()
  }

  // 11. Modal de edição de agendamento
  function setupEditAppointmentModal() {
    DOM.modals.editServiceCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", handleEditServiceSelection)
    })

    DOM.modals.editDateInput.addEventListener("change", () => {
      populateEditTimeSlots(DOM.modals.editDateInput.value, DOM.modals.editBarberSelect.value)
    })

    DOM.modals.editBarberSelect.addEventListener("change", () => {
      populateEditTimeSlots(DOM.modals.editDateInput.value, DOM.modals.editBarberSelect.value)
    })

    DOM.modals.closeEditBtn.addEventListener("click", closeEditModal)
    DOM.modals.editForm.addEventListener("submit", handleEditSubmit)
  }

  function handleEditServiceSelection() {
    const selectedServices = document.querySelectorAll(".edit-service-checkbox:checked")

    if (selectedServices.length > 3 && this.checked) {
      this.checked = false
      alert("Você pode selecionar no máximo 3 serviços.")
      return
    }

    updateEditTotalPrice()
  }

  function updateEditTotalPrice() {
    let total = 0
    let selectedCount = 0

    DOM.modals.editServiceCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        selectedCount++
        total += Number.parseFloat(checkbox.dataset.price)
      }
    })

    if (selectedCount > 3) return false

    DOM.modals.editTotalPrice.textContent = total.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
    return true
  }

  async function openEditModal(appointmentId) {
    state.currentEditingAppointmentId = appointmentId

    try {
      const appointment = await fetchWithErrorHandling(`${window.env.API_URL}api/agendamentos/${appointmentId}`, {
        headers: { 'access_token': token }
      })
      if(appointment){
        populateEditForm(appointment)
        DOM.modals.editAppointment.style.display = "block"
      }
    } catch (error) {
      console.error("Erro ao buscar dados do agendamento:", error)
      alert("Não foi possível carregar os dados do agendamento. Tente novamente mais tarde.")
    }
  }

  function populateEditForm(appointment) {
    const [date, time] = appointment.date.split(" ")

    // Limpar checkboxes
    DOM.modals.editServiceCheckboxes.forEach((checkbox) => {
      checkbox.checked = false
    })

    // Marcar serviços do agendamento
    appointment.services.forEach((service) => {
      const checkbox = Array.from(DOM.modals.editServiceCheckboxes).find(
        (cb) => cb.dataset.name.toLowerCase() === service.name.toLowerCase(),
      )
      if (checkbox) checkbox.checked = true
    })

    DOM.modals.editBarberSelect.value = appointment.barber_name
    DOM.modals.editDateInput.value = date

    populateEditTimeSlots(date, appointment.barber_name, time.slice(0, 5))
    updateEditTotalPrice()
  }

  async function populateEditTimeSlots(selectedDate, selectedBarber, currentTime) {
    DOM.modals.editTimeSelect.innerHTML = ""

    if (!selectedDate || !selectedBarber) {
      DOM.modals.editTimeSelect.innerHTML = '<option value="">Selecione uma data e um barbeiro</option>'
      return
    }

    try {
      const url = `${window.env.API_URL}api/agendamentos?barber_name=${encodeURIComponent(selectedBarber)}&start_date=${selectedDate}&end_date=${selectedDate}&status=scheduled&status=confirmed`
      const existingAppointments = await fetchWithErrorHandling(url, {
        headers: { 'access_token': token }
      })

      if (existingAppointments.data) {
        const occupiedTimes = existingAppointments.data
          .filter((appointment) => appointment._id !== state.currentEditingAppointmentId)
          .map((appointment) => {
            const [, time] = appointment.date.split(" ")
            return time.slice(0, 5)
          })
        populateEditTimeOptions(occupiedTimes, currentTime)
      }
      else {
        throw new Error(existingAppointments.message)
      }
    } catch (error) {
      console.error("Erro ao buscar horários disponíveis:", error)
      DOM.modals.editTimeSelect.innerHTML = '<option value="">Erro ao carregar horários</option>'
    }
  }

  function populateEditTimeOptions(occupiedTimes, currentTime) {
    const start = 8 * 60 // 8:00
    const end = 18 * 60 // 18:00
    const now = new Date();
    const selectedDate = DOM.modals.editDateInput.value;
    let hasAvailableSlots = false

    for (let i = start; i <= end; i += 30) {
      const hour = Math.floor(i / 60)
      const minute = i % 60
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`

      const option = document.createElement("option")
      option.value = time
      option.textContent = time

      if (time === currentTime) {
        hasAvailableSlots = true;
        option.selected = true
        option.textContent += " (Horário atual)"
        DOM.modals.editTimeSelect.appendChild(option)
        continue;
      }

      const dateStr = `${selectedDate}T${time}:00`;
      const date = new Date(dateStr);

      const isNotAvailable = date < now
      const isOccupied = occupiedTimes.includes(time)

      if(isNotAvailable){
        option.disabled = true;
        option.textContent += " (Indisponível)"
      }
      else{
        if (isOccupied) {
          option.disabled = true
          option.textContent += " (Ocupado)"
        }
        else{
          hasAvailableSlots = true
          DOM.modals.editTimeSelect.appendChild(option)
        }
      }
    }

    if (!hasAvailableSlots) {
      DOM.modals.editTimeSelect.innerHTML = '<option value="">Nenhum horário disponível</option>'
    }
  }

  function closeEditModal() {
    DOM.modals.editAppointment.style.display = "none"
    state.currentEditingAppointmentId = null
  }

  async function handleEditSubmit(e) {
    e.preventDefault()

    if (!state.currentEditingAppointmentId) {
      alert("ID do agendamento não encontrado.")
      return
    }

    const formData = extractEditFormData()
    if (!validateEditForm(formData)) return

    try {
      await updateAppointment(formData)
      handleEditSuccess()
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error)
      alert("Erro ao atualizar agendamento. Tente novamente mais tarde.")
    }
  }

  function extractEditFormData() {
    const selectedServices = Array.from(DOM.modals.editServiceCheckboxes).filter((cb) => cb.checked)

    return {
      services: selectedServices.map((cb) => ({
        name: cb.dataset.name,
        price: Number.parseFloat(cb.dataset.price),
      })),
      barber_name: DOM.modals.editBarberSelect.value,
      date: `${DOM.modals.editDateInput.value} ${DOM.modals.editTimeSelect.value}:00`,
    }
  }

  function validateEditForm(formData) {
    if (formData.services.length === 0) {
      alert("Por favor, selecione pelo menos um serviço.")
      return false
    }

    if (formData.services.length > 3) {
      alert("Você pode selecionar no máximo 3 serviços.")
      return false
    }

    return true
  }

  async function updateAppointment(formData) {
    return await fetchWithErrorHandling(`${window.env.API_URL}api/agendamentos/${state.currentEditingAppointmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", 'access_token': token },
      body: JSON.stringify(formData),
    })
  }

  function handleEditSuccess() {
    closeEditModal()
    showScheduleMessage("Agendamento atualizado com sucesso!", "success")
    refreshAppointmentData()
  }

  // 12. Modal de edição de usuário
  function setupUserEditModal() {
    const cancelBtn = DOM.modals.cancelUserEdit
    const modal = DOM.modals.userEdit
    const form = DOM.modals.userEditForm

    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none"
      DOM.modals.userEditMessage.textContent = ""
    })

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none"
        DOM.modals.userEditMessage.textContent = ""
      }
    })

    form.addEventListener("submit", handleUserEditSubmit)
    setupUserDeleteButton()
  }

  async function openUserEditModal(userId) {
    try {
      const btnInner = DOM.user.editBtn.innerHTML;
      DOM.user.editBtn.innerHTML = 'Carregando informações...'
      const user = await fetchWithErrorHandling(`${window.env.API_URL}api/usuarios`, 
        {headers: {'access_token' : token}})

      setTimeout(() => {
        DOM.user.editBtn.innerHTML = btnInner
      }, 250);
      if(!user){
        DOM.modals.userEdit.style.display = "none"
        DOM.modals.userEditMessage.textContent = ""
        return;
      }
      document.getElementById("userEditName").value = user.name
      document.getElementById("userEditEmail").value = user.email

      // Limpar campos
      document.getElementById("userEditCurrentPassword").value = ""
      document.getElementById("userEditNewPassword").value = ""
      document.getElementById("userEditConfirmPassword").value = ""
      DOM.modals.userEditMessage.textContent = ""

      DOM.modals.userEdit.style.display = "flex"
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error)
      alert("Não foi possível carregar os dados do usuário. Tente novamente.")
    }
  }

  async function handleUserEditSubmit(e) {
    e.preventDefault()

    const formData = extractUserEditFormData()
    if (!validateUserEditForm(formData)) return

    try {
      await updateUserProfile(formData)
      handleUserEditSuccess(formData)
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      showUserEditMessage(error.errors ? error.errors[0].msg : error.message || "Erro ao atualizar dados. Tente novamente.", "error")
    }
  }

  function extractUserEditFormData() {
    return {
      name: document.getElementById("userEditName").value.trim(),
      email: document.getElementById("userEditEmail").value.trim(),
      password: document.getElementById("userEditCurrentPassword").value,
      newPassword: document.getElementById("userEditNewPassword").value,
      confirmPassword: document.getElementById("userEditConfirmPassword").value,
    }
  }

  function validateUserEditForm(formData) {
    if (!formData.name || !formData.email || !formData.password) {
      showUserEditMessage("Nome, email e senha atual são obrigatórios.", "error")
      return false
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      showUserEditMessage("As novas senhas não coincidem.", "error")
      toastNotification({ error: true, message: "As novas senhas não coincidem." })
      return false
    }

    return true
  }

  async function updateUserProfile(formData) {
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }

      if (formData.newPassword) {
        updateData.newPassword = formData.newPassword
      }

      const response = await fetchWithErrorHandling(`${window.env.API_URL}api/usuarios`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", 'access_token': token },
        body: JSON.stringify(updateData),
      })

      if (!response || response.error) {
        throw new Error(response.errors ? response.errors[0].msg : response.message || "Erro ao atualizar dados.")
      }

      return response
    } catch (error) {
      console.log('Erro ao atualizar usuário: ' + error)
      throw error; 
    }
  }

  function handleUserEditSuccess(formData) {
    // Atualizar nome exibido
    DOM.user.name.textContent = "Bem vindo " + formData.name + "!"

    showUserEditMessage("Dados atualizados com sucesso!", "success")

    setTimeout(() => {
      DOM.modals.userEdit.style.display = "none"
      DOM.modals.userEditMessage.textContent = ""
    }, 1000)
  }

  function showUserEditMessage(message, type) {
    DOM.modals.userEditMessage.textContent = message
    DOM.modals.userEditMessage.style.color = type === "error" ? "#dc3545" : "#28a745"
  }

  function setupUserDeleteButton() {
    DOM.modals.deleteAccountBtn.addEventListener("click", () => {
      showConfirmationModal(currentUser._id, "deleteAccount")
    })
  }

  async function deleteUserAccount() {
    try {
      DOM.modals.userDeleteMessage.innerHTML = 'Aguarde enquanto excluímos sua conta...'
      const deletedUser = await fetchWithErrorHandling(`${window.env.API_URL}api/usuarios`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", 'access_token': token },
      })

      if (!deletedUser.error) {
        sessionStorage.setItem("authMsg", JSON.stringify({
              error: false,
              message: `${deletedUser.message}`|| "Conta exclúida com sucesso"
        }));
        localStorage.removeItem("user")
        setTimeout(() => {
          window.location.href = "login.html"
        }, 500);
      }
    } catch (error) {
      console.error("Erro ao excluir conta:", error)
      alert("Erro ao excluir conta. Tente novamente.")
    }
  }

  // 13. Inicialização
  initializeComponents()
}

// Inicializar o módulo
if (document.querySelector(".dashboard-container")) initializeDashboard()



const horariosFixos = [
  "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

function atualizarHorariosDisponiveis() {
  
}

dateInput.addEventListener("change", atualizarHorariosDisponiveis);

window.addEventListener("DOMContentLoaded", () => {
  const hoje = new Date().toISOString().split("T")[0];
  dateInput.value = hoje;
  atualizarHorariosDisponiveis();
});
