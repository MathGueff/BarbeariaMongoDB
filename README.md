# BarbeariaMongoDB

Para conseguir acesso às funcionalidades do site, <a href="#tabela"> clique aqui para ver a tabela de usuários para teste </a>

## 📑 Índice

- [🔸 Membros do grupo](#membros-do-grupo)
- [🔸 Link do Projeto e API pública](#link-do-projeto-e-api-pública)
- [🔸 Propósito do projeto](#propósito-do-projeto)
- [🔸 Como funciona o projeto](#como-funciona-o-projeto)
  - [📌 Categorização dos agendamentos](#categorização-dos-agendamentos)
  - [📌 Horários ocupados](#horários-ocupados)
  - [📌 Excluindo um usuário](#excluindo-um-usuário)
- [🔸 Estrutura do projeto](#estrutura-do-projeto)
- [🔸 Instalação e Execução](#instalação-e-execução)
- [🔸 Rotas da API](#rotas-da-api)
  - [🔐 Autenticação (Usuários)](#-autenticação-usuários)
  - [📅 Agendamentos](#-agendamentos)
  - [📖 Documentação](#-documentação)
- [🔸 Usuários do sistema](#usuários-do-sistema)
  - [👥 Dados gerais de usuários gerados por mockaroo](#dados-gerais-de-usuários-gerados-por-mockaroo)
  - [👤 Usuários de teste por nível](#usuários-de-teste-por-nível)
  - [🧑‍💻 Usuários do nosso grupo](#usuários-do-nosso-grupo)



## Membros do grupo:

* Andreza de Oliveira Carlos
* Guilherme Pazetti de Oliveira
* Gustavo Lopes Ferreira
* Matheus Augusto Santos Gueff

## Link do Projeto e API pública

Projeto no Vercel
* https://barbearia-mongo-db-liart.vercel.app

API hospedada
* https://barbearia-mongo-db-liart.vercel.app/api/agendamentos

## Propósito do projeto

O nosso projeto é um sistema de cadastro de agendamentos de uma barbearia, permitindo aos clientes uma forma simples e flexível de agendarem um horário, ao mesmo tempo que nossos barbeiros poderão ter um controle melhor e organizado do seu trabalho.

## Como funciona o projeto

Nosso projeto é um site de barbearia, onde clientes podem realizar seu agendamento marcando um horário com um barbeiro e dia escolhidos.

## Estrutura do projeto

```
├── __tests__/
│   └── testes.js/           # Arquivos de testes Jest para usuários e agendamentos
├── api/
│   ├── config/
│   │   └── db.js                    # Configuração do MongoDB
│   ├── controllers/
│   │   ├── agendamento.js           # Lógica de negócio dos agendamentos
│   │   └── usuario.js               # Lógica de autenticação
│   ├── middlewares/
│   │   ├── validation.js            # Validações para usuários e agendamentos                      
│   │   └── auth.js                  # Validação de token JWT    
│   ├── http/  
│   │   ├── agendamentos.http        # Arquivo de documentação REST CLIENT para agendamentos      
│   │   └── usuario.http             # Arquivo de documentação REST CLIENT para agendamentos    
│   ├── json/  
│   │   ├── agendamentos.js          # Mock de agendamentos para preenchimento inicial       
│   │   └── usuarios.js              # Mock de usuarios para preenchimento inicial                       
│   ├── models/
│   │   ├── agendamentos.js          # Script de importação de json de agendamentos
│   │   └── usuarios.js              # Script de importação de json de usuários
│   ├── routes/
│   │   ├── agendamentos.js          # Rotas de agendamentos
│   │   └── usuarios.js              # Rotas de usuários
│   ├── swagger/
│   │   └── swagger_output.json      # Arquivo de documentação gerado
│   └── index.js                     # Arquivo principal do servidor
├── public/
│   └── images/
│       └── favicon.png              # Ícone da aplicação
│   └── ...                          # Arquivos do frontend
├── .env                             # Variáveis de ambiente 
├── package.json                     # Dependências e scripts do projeto
├── README.md                        # Documentação do projeto
├── swagger.js.md                    # Script de geração de documentação swagger
└── vercel.json                      # Deploy no Vercel
```

## Instalação e Execução

1. **Clone o repositório:**
```bash
git clone https://github.com/MathGueff/BarbeariaMongoDB.git

```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto:
```env
//Necessários para rodar o site
MONGODB_URI = stringConexao
BASE_URL = urlDoSite
SECRET_KEY = sua_chave_secreta
EXPIRES_IN = 7 days

//Usados para teste e documentação:
UNEXPERIDED_TOKEN = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvIjp7ImlkIjoiNjg0ZjIwN2FkNGQwZTNlOTRkNDdmMjcxIiwibml2ZWwiOjJ9LCJpYXQiOjE3NTAwMTY1MDV9.ng7AA5ZSu3p5nQnNfBvE7sYtHTtBwtgRywChaTKRso0
EXPIRED_TOKEN = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvIjp7ImlkIjoiNjg0ZjIwN2FkNGQwZTNlOTRkNDdmMjcxIiwibml2ZWwiOjJ9LCJpYXQiOjE3NTAwMTY1MzgsImV4cCI6MTc1MDAxNjUzOX0.QpnbqqkoDRr-fGtg6CbpYz5Xuw741DA8jJoZEKiHXUo
SENHA_USUARIO = Gueff12*
```

4. **Inicie o servidor:**
```bash
npm start
```

**Para desenvolvimento:**
```bash
npm run dev
```

6. **Acesse a aplicação:**
   - Frontend: `http://localhost:3000`
   - Documentação Swagger: `http://localhost:3000/api-docs`

## Rotas da API

#### 🔐 Autenticação (Usuários)

- **POST** `/api/usuarios`  
  Registra um novo usuário

- **POST** `/api/usuarios/login`  
  Autentica um usuário

- **GET** `/api/usuarios`  
  Obtém informações do usuário autenticado (**exige autenticação**)

- **PUT** `/api/usuarios`  
  Atualiza os dados do usuário autenticado (**exige autenticação**)

- **DELETE** `/api/usuarios`  
  Remove o usuário autenticado (**exige autenticação**)

---

#### 📅 Agendamentos  
**Todas as rotas protegidas por JWT**

- **GET** `/api/agendamentos`  
  Retorna todos os agendamentos (**exige autenticação**)

- **GET** `/api/agendamentos/:id`  
  Retorna um agendamento específico pelo ID (**exige autenticação**)

- **POST** `/api/agendamentos`  
  Cria um novo agendamento (**exige autenticação**)

- **PUT** `/api/agendamentos/:id`  
  Atualiza um agendamento existente (**exige autenticação**)

- **PATCH** `/api/agendamentos/:id/status`  
  Altera o status de um agendamento (ex: para "cancelado") (**exige autenticação**)

- **DELETE** `/api/agendamentos/:id`  
  Remove um agendamento (**exige autenticação**)

---

#### 📖 Documentação

- **GET** `/api/doc`  
  Acessa a documentação interativa via Swagger

#### Categorização dos agendamentos
No sistema, armazenamos agendamentos como agendado, confirmado e cancelado
- Agendado: marcado ao criar um agendamento e até que esse seja cancelado ou confirmado
- Confirmado: o agendamento foi confirmado para aquela data pelo barbeiro
- Cancelado: o agendamento foi cancelado (pelo cliente ou pelo barbeiro)

#### Horários ocupados
Ao realizar seu agendamento, horários já ocupados por outros clientes são marcados em cinza e não podem ser selecionados. Agendamentos que foram cancelados não são considerados no momento de escolher um horário. Agendamentos só podem ser realizados com 1 dia de antecedência mínimo

#### Excluindo um usuário
Quando um cliente excluir sua conta de usuário, todos os agendamentos marcados como "agendado" são exclúidos para a liberação dos horários

## Usuários do sistema

### Dados gerais de usuários gerados por mockaroo
- **Total de usuários**: 80
- **Estrutura dos dados**:
  - Nomes únicos (todos com agendamentos cadastrados)
  - Emails relacionados aos nomes
  - Padrão de senhas: `Senha12*`, `Senha34*`, `Senha56*`, `Senha78*`, `Senha910*`
Foram adicionados agendamentos de 01/06 até 25/06 no banco de dados via mock (500 registros)

<span id='tabela'>

### Usuários de teste por nível

Os usuários abaixo estão cadastrados no banco de dados do site para que o professor possa testar.

| Nível de acesso| Email               | Senha      | Permissões                                                                 |
|-------|---------------------|------------|----------------------------------------------------------------------------|
| 0     | ricardo0@gmail.com  | Ricardo0*  | Agendar e cancelar próprios agendamentos (Cliente)                        |
| 1     | ricardo1@gmail.com  | Ricardo1*  | Ver todos agendamentos, cancelar, confirmar e deletar agendamentos        |
| 2     | ricardo2@gmail.com  | Ricardo2*  | Todas as permissões de nível 1 + adicionar novos administradores          |

### Usuários do nosso grupo

| Nome      | Email               | Senha        | Nível |
|-----------|---------------------|--------------|-------|
| Andreza de Oliveira Carlos   | andreza@gmail.com   | Andreza12*   | 2     |
| Guilherme Pazetti de Oliveira | guilherme@gmail.com | Guilherme12* | 2     |
| Gustavo Lopes Ferreira   | gustavo@gmail.com   | Gustavo12*   | 2     |
| Matheus Augusto Santos Gueff    | gueff@gmail.com     | Gueff12*     | 2     |