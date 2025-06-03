import { fetchWithErrorHandling } from './script.js';

const vercelApi =  "https://barbearia-mongo-db-liart.vercel.app/"

const apiUrl = vercelApi
// Módulo de Autenticação
function initializeAuth() {
    const loginForm = document.getElementById("loginForm")
    const registerForm = document.getElementById("registerForm")
    const showRegister = document.getElementById("showRegister")
    const showLogin = document.getElementById("showLogin")
    const loginBox = document.getElementById("loginBox")
    const registerBox = document.getElementById("registerBox")
    const loginMessage = document.getElementById("loginMessage")
  
    // Alternar entre login e cadastro
    showRegister?.addEventListener("click", () => {
      loginBox.style.display = "none"
      registerBox.style.display = "block"
    })
  
    showLogin?.addEventListener("click", () => {
      loginBox.style.display = "block"
      registerBox.style.display = "none"
    })
  
    // Simulação de usuário logado (substituir por backend real)
    let currentUser = JSON.parse(localStorage.getItem("user")) || null
  
    // Função para carregar dados locais quando a API falha
    // function loadLocalData(type, userData) {
    //   if (type === "login") {
    //     const { email, password } = userData
  
    //     // Verificar se é um administrador
    //     const adminUser = adminUsers.find((user) => user.email === email && user.password === password)
    //     if (adminUser) {
    //       return {
    //         user: adminUser,
    //         redirect: "admin-dashboard.html",
    //         message: "Login de administrador realizado com sucesso (modo offline).",
    //       }
    //     }
  
    //     // Verificar se já existe um usuário com este email no localStorage
    //     const localUsers = JSON.parse(localStorage.getItem("localUsers") || "[]")
    //     const existingUser = localUsers.find((user) => user.email === email && user.password === password)
  
    //     if (existingUser) {
    //       return {
    //         user: { ...existingUser, isAdmin: false },
    //         redirect: "dashboard.html",
    //         message: "Login realizado com sucesso (modo offline).",
    //       }
    //     } else if (email && password) {
    //       // Criar um usuário temporário se não existir
    //       const tempUser = { name: "Usuário", email, subscription: false, appointments: 0, isAdmin: false }
    //       return { user: tempUser, redirect: "dashboard.html", message: "Login simulado com sucesso (modo offline)." }
    //     }
  
    //     return null
    //   } else if (type === "register") {
    //     const { name, email, password } = userData
  
    //     // Salvar o novo usuário localmente
    //     const localUsers = JSON.parse(localStorage.getItem("localUsers") || "[]")
    //     const newUser = { name, email, password, subscription: false, appointments: 0, isAdmin: false }
  
    //     // Verificar se o email já está em uso
    //     if (localUsers.some((user) => user.email === email)) {
    //       return { error: "Este email já está em uso." }
    //     }
  
    //     localUsers.push(newUser)
    //     localStorage.setItem("localUsers", JSON.stringify(localUsers))
  
    //     return { user: newUser, redirect: "dashboard.html", message: "Cadastro realizado com sucesso (modo offline)." }
    //   }
  
    //   return null
    // }
  
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
        if (!response.error) {
          const userData = response.data
          currentUser = {...userData}
          if (userData.isAdmin) {
            localStorage.setItem("user", JSON.stringify(currentUser))
            window.location.href = "admin-dashboard.html"
            return
          }
          localStorage.setItem("user", JSON.stringify(currentUser))
          window.location.href = "dashboard.html"
          loginMessage.textContent = "Login realizado com sucesso!"
          loginMessage.style.color = "#28a745" // Verde para sucesso
        }
      } catch (error) {
        console.log(error)
        // Se houver erro de conexão, tentar carregar dados locais
        // const localResult = loadLocalData("login", { email, password })
  
        // if (localResult) {
        //   currentUser = localResult.user
        //   localStorage.setItem("user", JSON.stringify(currentUser))
        //   loginMessage.textContent = localResult.message
        //   loginMessage.style.color = "#28a745"
        //   window.location.href = localResult.redirect
        // } else {
        //   loginMessage.textContent = `Erro ao fazer login: ${error.message}. Tente novamente.`
        //   loginMessage.style.color = "#dc3545"
        // }
      }
    })
  
    registerForm?.addEventListener("submit", async (e) => {
      e.preventDefault()
      const name = document.getElementById("registerName").value
      const email = document.getElementById("registerEmail").value
      const password = document.getElementById("registerPassword").value
      const isAdmin = false

      try {
        const response = await fetchWithErrorHandling(`${apiUrl}api/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, isAdmin}),
        })
  
        if (!response.error) {
          const userData = response.data
          currentUser = { ...userData}
          localStorage.setItem("user", JSON.stringify(currentUser))
          if (userData.isAdmin) {
            localStorage.setItem("user", JSON.stringify(currentUser))
            window.location.href = "admin-dashboard.html"
            return
          }
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
  