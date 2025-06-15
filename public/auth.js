import { fetchWithErrorHandling, toastNotification } from './script.js';

// Módulo de Autenticação
function initializeAuth() {
  const loginForm = document.getElementById("loginForm")
  const registerForm = document.getElementById("registerForm")
  const showRegister = document.getElementById("showRegister")
  const showLogin = document.getElementById("showLogin")
  const loginBox = document.getElementById("loginBox")
  const registerBox = document.getElementById("registerBox")
  const loginMessage = document.getElementById("loginMessage")
  const registerMessage = document.getElementById("registerMessage")

  let currentUser;

  const toastData = JSON.parse(sessionStorage.getItem('authMsg'));
  if (toastData) {
    toastNotification(toastData)
    sessionStorage.removeItem("authMsg"); // limpa depois de usar
  }

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
      loginMessage.innerHTML = 'Aguarde um momento...'
      loginMessage.style.color = "white";
      const response = await fetchWithErrorHandling(`${window.env.API_URL}api/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.error) {
        const token = response.access_token

        if(token){
          localStorage.setItem("token", token)
          
          const currentUser = await fetchWithErrorHandling(`${window.env.API_URL}api/usuarios`, {
            headers : {"access_token" : token}
          })

          console.log(currentUser)

          sessionStorage.setItem("authMsg", JSON.stringify({
                error: false,
                message: response.message || "Login realizado com sucesso"
          }));

          if (currentUser.nivel == 1 || currentUser.nivel == 2) {
            window.location.href = "admin-dashboard.html"
            return;
          }
          window.location.href = "dashboard.html"
        }
        else{
          throw new Error('Token JWT não recebido')
        }
      }
      else{
        console.log(response)
        loginMessage.innerHTML = !response.errors ? response.message : response.errors[0].msg
        loginMessage.style.color = "#e23232";
      }
    } catch (error) {
      loginMessage.innerHTML = 'Algo deu errado, tente novamente'
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
      registerMessage.innerHTML = 'Aguarde um momento...'
      registerMessage.style.color = "white";
      const response = await fetchWithErrorHandling(`${window.env.API_URL}api/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, nivel }),
      })

      if (!response.error) {
        sessionStorage.setItem("authMsg", JSON.stringify({
              error: false,
              message: `${response.message}`|| "Cadastro realizado com sucesso, faça seu login"
        }));
        window.location.href = "login.html"
      }
      else{
        registerMessage.innerHTML = !response.errors ? response.message : response.errors[0].msg
        registerMessage.style.color = "#e23232";
      }
    } catch (error) {
      loginMessage.innerHTML = 'Algo deu errado, tente novamente'
      console.log(error)
    }
  })
}

// Exportar funções para uso em outros módulos
export { initializeAuth }

// Inicializar o módulo
if (document.querySelector(".auth-container")) initializeAuth()