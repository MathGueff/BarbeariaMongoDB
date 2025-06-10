import { fetchWithErrorHandling, toastNotification } from './script.js';

const vercelApi =  "https://barbearia-mongo-db-liart.vercel.app/"

const apiUrl = vercelApi || "http://localhost:3000/"
// Módulo de Autenticação
function initializeAuth() {
    const loginForm = document.getElementById("loginForm")
    const registerForm = document.getElementById("registerForm")
    const showRegister = document.getElementById("showRegister")
    const showLogin = document.getElementById("showLogin")
    const loginBox = document.getElementById("loginBox")
    const registerBox = document.getElementById("registerBox")
    const loginMessage = document.getElementById("loginMessage")
    
    let currentUser;
  
    // Alternar entre login e cadastro
    showRegister?.addEventListener("click", () => {
      loginBox.style.display = "none"
      registerBox.style.display = "block"
    })
  
    showLogin?.addEventListener("click", () => {
      loginBox.style.display = "block"
      registerBox.style.display = "none"
    })
  
    loginForm?.addEventListener("submit", async (e) => {
      e.preventDefault()
      const email = document.getElementById("loginEmail").value
      const password = document.getElementById("loginPassword").value
      try {
        const response = await fetchWithErrorHandling(`${apiUrl}api/usuarios/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password}),
        })
        console.log(response)
        if (!response.error) {
          const userData = response.data
          currentUser = {...userData}
          localStorage.setItem("user", JSON.stringify(currentUser))
          if (userData.nivel == 1 || userData.nivel == 2) {
            window.location.href = "admin-dashboard.html"
            return;
          }
          window.location.href = "dashboard.html"
          loginMessage.textContent = "Login realizado com sucesso!"
          loginMessage.style.color = "#28a745" // Verde para sucesso
        }
      } catch (error) {
        console.log(error)
      }
    })
  
    registerForm?.addEventListener("submit", async (e) => {
      e.preventDefault()
      const name = document.getElementById("registerName").value
      const email = document.getElementById("registerEmail").value
      const password = document.getElementById("registerPassword").value
      const nivel = 0

      try {
        const response = await fetchWithErrorHandling(`${apiUrl}api/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, nivel}),
        })
  
        if (!response.error) {
          const userData = response.data
          currentUser = { ...userData}
          localStorage.setItem("user", JSON.stringify(currentUser))
          window.location.href = "dashboard.html"
          loginMessage.textContent = "Cadastro realizado com sucesso!"
          loginMessage.style.color = "#28a745" // Verde para sucesso
        }
      } catch (error) {
        console.log(error)
      }
    })
  }
  
  // Exportar funções para uso em outros módulos
  export { initializeAuth }
  
  // Inicializar o módulo
  if (document.querySelector(".auth-container")) initializeAuth()
  