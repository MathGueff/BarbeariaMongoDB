/**
 * Testes na API de Usuários
 * 
 */
const request = require('supertest')
const dotenv = require('dotenv')
dotenv.config() //carrega os valores do .env

const baseURL = 'http://localhost:3000/api'
let token = process.env.EXAMPLE_TOKEN

describe('REGISTRO DE USUÁRIO', () => {
    let idUsuarioCriado;

    it('POST - Verificar se um novo usuário pode ser registrado com sucesso,', async () => {
        const response = await request(baseURL)
            .post("/usuarios")
            .set('Content-type', 'application/json')
            .send({name : 'Usuário Novo', email : 'newuser@gmail.com', password : 'novoUsuario'})
            .expect(201) //Cadastrado com sucesso

            //Verificando se o usuário foi cadastrado e se o atributo _id está correto
            expect(response.body.data).toHaveProperty("_id")
            expect(typeof response.body.data._id).toBe("string")
            expect(response.body.data._id.length).toBeGreaterThan(0)

            //Atribui o _id do usuário criado para a let para que possa ser acessado por outros testes
            idUsuarioCriado = response.body.data._id
    })

    it('DELETE - Realiza a exclusão do usuário', async () => {
        const response = await request(baseURL)
            .delete(`/usuarios/${idUsuarioCriado}`)
            .set('Content-type', 'application/json')
            .set('access-token', token)
            .expect(200) //Excluído com sucesso
        
        //Verificando se a exclusão está retornando o feedback correto
        expect(response.body.error).toBe(false)
        expect(response.body.message).toBe('Usuário excluído com sucesso')
    })

    it('POST - Validar se o email e nome do usuário já está registrado antes de permitir o registro', 
    async () => {
        const emailExistente = await request(baseURL)
            .post(`/usuarios`)
            .set('Content-type', 'application/json')
            .send({name : 'Nome Novo', email : 'gueff@gmail.com', password : 'senha12345'})
            .expect(409) //Email já existente

        const nomeExistente = await request(baseURL)
            .post(`/usuarios`)
            .set('Content-type', 'application/json')
            .send({name : 'Matheus Gueff', email : 'emailnovo@gmail.com', password : 'senha12345'})
            .expect(409) //Nome já existente

        //Verificando se o feedback de email existente está funcionando
        expect(emailExistente.body.message).toBe('Um cadastro já foi realizado com esse email')
        expect(emailExistente.body.error).toBe(true)

        //Verificando se o feedback de nome existente está funcionando
        expect(nomeExistente.body.message).toBe('Um cadastro já foi realizado com esse nome')
        expect(nomeExistente.body.error).toBe(true)
    })
})

describe('AUTENTICAÇÃO DE USUÁRIO', () => {
    let userEmail = 'gueff@gmail.com'; //email para testes de login
    let password = process.env.SENHA_USUARIO //senha para testes de login
    
    it('POST - Verificar se um usuário registrado pode se autenticar com sucesso, fornecendo email e senha válidos', async () => {
        const response = await request(baseURL)
            .post('/usuarios/login')
            .set('Content-Type', 'application/json')
            .send({email : userEmail, "password" : password})
            .expect(200) //Usuário autenticado com sucesso

        //Garantindo que um token JWT válido seja gerado para o usuário
        const token = response.body.data //TODO: alterar para .token
        expect(token).toBeDefined()
    })

    it('POST - Validar se os dados de autenticação (email e senha) estão corretos', async () => {
        const response = await request(baseURL)
            .post("/usuarios/login")
            .set('Content-type', 'application/json')
            .send({email : userEmail, password : 'senhaErrada'})
            .expect(401) //Unauthorized

        //Veficando se o feedback de login incorreto está sendo exibido corretamente
        expect(response.body.message).toBe("O email ou a senha digitados estão incorretos")
        expect(response.body.error).toBe(true)
    })

   /* TODO:
        Verificar se o token JWT contém as informações do usuário e a data
        de expiração
   */ 
})

describe('VALIDAÇÃO DE TOKEN JWT', () => {
    it('GET - Validar se um token JWT válido permite o acesso a rotas protegidas', async () => {
        const response = await request(baseURL)
            .get("/agendamentos")
            .set('access-token', token)
            .expect(200) //Token válido
        
        //Verificando se houve o retorno dos dados do agendamento e se é o retorno correto (array)
        expect(response.body.data).toBeDefined()
        expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('GET - Verificar se um token JWT inválido ou expirado é recusado', async () => {
        const tokenInvalido = "tokenInvalido"

        const response = await request(baseURL)
            .get("/agendamentos")
            .set('access-token', tokenInvalido)
            .expect(403) //Token inválido

        //TODO: utilizar um token expirado
    })
})

describe('ROTAS PROTEGIDAS', () => {
    it('GET - Verificar se o acesso a rotas protegidas é restrito a usuários autenticados', async () => {
        const acessoComToken = await request(baseURL)
            .get('/agendamentos')
            .set('access-token', token)
            .expect(200) //Acesso com token

        const acessoSemToken = await request(baseURL)
             .get('/agendamentos')
             .expect(401)

        //Verificando se o acesso com token retornou os dados de agendamentos
        expect(acessoComToken.body.data).toBeDefined()
        expect(Array.isArray(acessoComToken.body.data)).toBe(true)

        //Verificando se o acesso sem token não retornou os dados e se retornou a mensagem e o erro
        expect(acessoSemToken.body.data).toBeUndefined()
        expect(acessoSemToken.body.error).toBe(true)
        expect(acessoSemToken.body.message).toBe("Acesso negado, é obrigatório o envio do token JWT")
    })
})