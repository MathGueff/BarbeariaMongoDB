# BarbeariaMongoDB

Para conseguir acesso às funcionalidades do site, <a href="#tabela"> clique aqui para ver a tabela de usuários para teste </a>

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

#### Categorização dos agendamentos
No sistema, armazenamos agendamentos como agendado, confirmado e cancelado
- Agendado: marcado ao criar um agendamento e até que esse seja cancelado ou confirmado
- Confirmado: o agendamento foi confirmado para aquela data pelo barbeiro
- Cancelado: o agendamento foi cancelado (pelo cliente ou pelo barbeiro)

#### Horários ocupados
Ao realizar seu agendamento, horários já ocupados por outros clientes são marcados em cinza e não podem ser selecionados. Agendamentos que foram cancelados não são considerados no momento de escolher um horário.

#### Excluindo um usuário
Quando um cliente excluir sua conta de usuário, todos os agendamentos marcados como "agendado" são exclúidos para a liberação dos horários

## Usuários do sistema

### Dados gerais de usuários gerados por mockaroo
- **Total de usuários**: 80
- **Estrutura dos dados**:
  - Nomes únicos (todos com agendamentos cadastrados)
  - Emails relacionados aos nomes
  - Padrão de senhas: `Senha12*`, `Senha34*`, `Senha56*`, `Senha78*`, `Senha910*`

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