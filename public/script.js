// script.js

// Função auxiliar para fazer requisições fetch com tratamento de erros
export async function fetchWithErrorHandling(url, options = {}) {
    let responseData = null

    try {
        const response = await fetch(url, options)
        responseData = await response.json()
    } catch (error) {
        console.error(`Erro na requisição para ${url}:`, error)
        responseData = {
            error: true,
            message: error.errors.msg || "Ocorreu um erro na requisição",
        }
    } finally {
        // Chama a função de toast com os dados da resposta
        console.log(responseData)
        if (responseData != null) {
            toastNotification(responseData)
        }
    }
    return responseData
}

export function toastNotification(data) {
    // Verifica se o objeto data existe e tem as propriedades necessárias
    if (!data || typeof data.error === "undefined" || !data.message) {
        return
    }

    // Cria o elemento toast
    const toast = document.createElement("div")

    // Estiliza o toast
    Object.assign(toast.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "12px 20px",
        borderRadius: "4px",
        color: "white",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        zIndex: "9999",
        minWidth: "250px",
        maxWidth: "350px",
        backgroundColor: data.error ? "#f44336" : "#4caf50",
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "fadeIn 0.3s, fadeOut 0.3s 2.7s",
    })

    if(data.errors)
        toast.textContent = data.errors[0].msg
    else
        toast.textContent = data.message

    // Adiciona o CSS para animação
    const style = document.createElement("style")
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(20px); }
      }
    `
    document.head.appendChild(style)

    // Adiciona o toast ao DOM
    document.body.appendChild(toast)

    // Remove o toast após 3 segundos
    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast)
        }
    }, 3000)
}

// Inicialização por página
if (document.querySelector('.carousel') || document.querySelector('.testimonials-carousel') || document.querySelector('.stats-section')) {
    // Carregar o script do carrossel e contador (index.html)
    const script = document.createElement('script');
    script.src = 'carousel.js';
    script.type = 'module'
    document.body.appendChild(script);
}

if (document.querySelector('.auth-container')) {
    // Carregar o script de autenticação (login.html)
    const script = document.createElement('script');
    script.src = 'auth.js';
    script.type = 'module'
    document.body.appendChild(script);
}

if (document.querySelector('.dashboard-container')) {
    // Carregar o script do dashboard de cliente (dashboard.html)
    const script = document.createElement('script');
    script.src = 'dashboard.js';
    script.type = 'module'
    document.body.appendChild(script);
}

if (document.querySelector('.admin-dashboard-container')) {
    // Carregar o script do dashboard de administrador (admin-dashboard.html)
    const script = document.createElement('script');
    script.src = 'admin-dashboard.js';
    script.type = 'module'
    document.body.appendChild(script);
}