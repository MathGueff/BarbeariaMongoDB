import express from 'express'
import cors from 'cors' // Importa o módulo cors
import { connectToDatabase } from './config/db.js'
import agendamentosRoutes from './routes/agendamentos.js'
import usuariosRoutes from './routes/usuarios.js'
import path from 'path'
import fs from 'fs'
import swaggerUI from 'swagger-ui-express'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors()) //Habilita o CORS Cross-Origin resource sharing
app.use(express.json())//parse do JSON
//rota pública
app.use('/', express.static('public'))
//Rotas do app
app.use('/api/agendamentos', agendamentosRoutes)
app.use('/api/usuarios', usuariosRoutes)

// Carregamento do Swagger JSON de forma síncrona
const swaggerFilePath = path.resolve('api/swagger/swagger_output.json')
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerFilePath, 'utf8'))

// Rota da documentação 
app.use('/api/doc', swaggerUI.serve, swaggerUI.setup(swaggerDocument))

//define o favicon
app.use('/favicon.ico', express.static('public/images/favicon.png'))
//start the server
connectToDatabase(app).then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}!`)
    })
})