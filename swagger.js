import swaggerAutogen from 'swagger-autogen'

const doc = {
    swagger: "2.0",
    info: {
        version: "1.0.0",
        title: "API Barbearia MongoDB",
        description: "➡️Documentação gerada automaticamente pelo módulo <a href='https://github.com/davibaltar/swagger-autogen' target='_blank'>swagger-autogen</a>."
    },
    host: 'barbearia-mongo-db-liart.vercel.app',
    basePath: "/",
    schemes: ['https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
        apiKeyAuth:{
            type: "apiKey",
            in: "header",       
            name: "access_token",  
            description: "Token de Acesso gerado após o login"
        }
    },
    security: [
    {
        apiKeyAuth: []
    }
    ],
    definitions: {
        Erro: {
            value: "Erro gerado pela aplicação",
            msg: "Mensagem detalhando o erro",
            param: "URL que gerou o erro"
        }
    }
}

const outputFile = './api/swagger/swagger_output.json'
const endpointsFiles = ['./api/index.js']
const options = {
    swagger: '2.0',          // By default is null
    language: 'pt-BR',         // By default is 'en-US'
    disableLogs: false,     // By default is false
    disableWarnings: false  // By default is false
}

swaggerAutogen(options)(outputFile, endpointsFiles, doc).then(async () => {
    await import('./api/index.js'); 
  });