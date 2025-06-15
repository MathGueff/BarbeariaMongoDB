// script.js

// https://barbearia-mongo-db-liart.vercel.app/
// http://localhost:3000/

window.env = {
    API_URL : 'http://localhost:3000/'
}

// Função auxiliar para fazer requisições fetch com tratamento de erros
export async function fetchWithErrorHandling(url, options = {}, notificate = true) {
    let responseData = null;

    try {
        const response = await fetch(url, options);
        responseData = await response.json();
    } catch (error) {
        console.error(error);
        responseData = {
            error: true,
            message: 'Ocorreu um erro inesperado, tente novamente'
        };
    } finally {
        if (responseData && notificate === true) {
            toastNotification(responseData);
        }
    }

    return responseData;
}

export function tokenValidator(response){
    sessionStorage.setItem("authMsg", JSON.stringify({
        error: true,
        message: response.message || "Sessão expirada"
    }));
    window.location.href = 'login.html';
}

export function toastNotification(data) {
    try {
        // Verifica se o objeto data existe e tem as propriedades necessárias
        if (!data || typeof data.error === "undefined" || !data.message) {
            throw new Error("Formato de 'data' inválido")
        }

        // Cria o elemento toast
        const toast = document.createElement("div")

        // Estiliza o toast
        Object.assign(toast.style, {
            position: "fixed",
            top: "20px", // Distância do topo
            left: "50%", // Centraliza horizontalmente (referência)
            padding: "12px 20px",
            borderRadius: "4px",
            fontSize: "18px",
            color: "white",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            zIndex: "9999",
            minWidth: "350px",
            maxWidth: "450px",
            backgroundColor: data.error ? "#e23232" : "#28a745",
            fontFamily: "system-ui, -apple-system, sans-serif", 
            opacity: "0", // Inicia invisível
            transform: "translateX(-50%) scale(0.95)", // Posição central + escala reduzida
            transition: "opacity 0.3s, transform 0.3s", // Transição suave
        });

        // Força a renderização antes de animar
        setTimeout(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateX(-50%) scale(1)";
        }, 10);

        // Remove após 3 segundos (equivalente ao fadeOut)
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(-50%) scale(0.95)";
            setTimeout(() => toast.remove(), 300); // Espera a animação terminar
        }, 3000);

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
    } catch (error) {
        console.log('O toast possui um erro: ' + error)
    }
    
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