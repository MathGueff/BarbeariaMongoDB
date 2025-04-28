import { ObjectId } from "mongodb"

const collectionAgendamentos = 'agendamentos'

export const getCountAgendamentos = async (req,res) => {
    try {
        const db = req.app.locals.db;
        const count = await db.collection(collectionAgendamentos).find().count()

        res.status(200).json({count})
    } catch (error) {
        console.error("Erro ao contar agendamentos:", error)
        res.status(500).json({ error: true, message: "Falha ao contar agendamentos" })
    }
}

// Get all Agendamentos
export const getAgendamentos = async (req, res) => {
    try {
        const {
            client_name, 
            barber_name,
            service, 
            date,
            start_date,
            end_date, 
            status, 
            sort, 
            page = 1, 
            limit = 0, 
            order = "asc"
        } = req.query
        const skip = (page - 1) * limit

        const query = {}
        if(client_name){
            query.client_name = {$regex : client_name, $options : "i"}
        }
        if(barber_name){
            query.barber_name = {$regex : barber_name, $options : "i"}
        }
        if(service) {
            query["services.name"] = service;
        }
        if(date || (start_date && end_date)){
            const start = date 
                ? date + " 00:00:00" 
                : start_date + " 00:00:00"
            const end = date 
                ? date + " 23:59:59"
                : end_date + " 23:59:59";
          
            query.date = {
              $gte: start,
              $lte: end
            };
        }
        if(status) {
            if(Array.isArray(status)){
                query.status = {$in : status}
            }
            else{
                query.status = status
            }
        }

        const sortOptions = {}
        if (sort) {
            sortOptions[sort] = order.toLowerCase() === "desc" ? -1 : 1
        } else {
            // Ordenação padrão por nome se nenhuma for especificada
            sortOptions.date = 1
        }

        const db = req.app.locals.db
        const agendamentos = await db
            .collection(collectionAgendamentos)
            .find(query)
            .sort(sortOptions) 
            .skip(Number.parseInt(skip))
            .limit(Number.parseInt(limit))
            .toArray()

        const total = await db.collection(collectionAgendamentos).find(query).count()
        res.status(200).json({
            data : agendamentos,
            pagination : {
                total,
                page: Number.parseInt(page),
                limit: Number.parseInt(limit),
                pages: limit != 0 ? Math.ceil(total / limit) : 1
            }
        })
    } catch (error) {
        console.error("Erro ao buscar agendamentos:", error)
        res.status(500).json({ error: true, message: "Falha ao buscar agendamentos" })
    }
}

// Get agendamento by ID
export const getAgendamentoById = async (req, res) => {
    try {
        const {id} = req.params
        const db = req.app.locals.db

        const agendamento = await db.collection(collectionAgendamentos).findOne({
            _id : new ObjectId(id)
        })
        if (!agendamento) 
            return res.status(404).json({ error: true, message: "Agendamento não encontrado" })
        
        res.status(200).json(agendamento)
    } catch (error) {
        console.error("Falha ao procurar por agendamento:", error)
        res.status(500).json({ error: true, message: "Falha ao procurar por agendamento" })
    }
}

// Create new agendamento
export const createAgendamento = async (req, res) => {
    try {
        const db = req.app.locals.db

        const { client_name,
            barber_name,
            services,
            date } = req.body

        let total_price = 0;
        const status = "scheduled"
      
        //Checando se uma data já existe
        const existingAgendamento = await db.collection(collectionAgendamentos).findOne(
            { date, barber_name, status : {$ne : 'canceled'}}
        )

        if (existingAgendamento) {
          return res.status(409).json({
            error: true,
            message: "Um agendamento já foi marcado para essa data com nosso barbeiro",
          })
        }
      
        const newAgendamento = {
            client_name,
            barber_name,
            services,
            date
        }

        if(services){
            newAgendamento.services.forEach(service => {
                total_price += service.price;
            });
        }

        const created_at = getBrazilDate();
        const updated_at = getBrazilDate();

        const result = await db.collection(collectionAgendamentos).insertOne({
            ...newAgendamento,
            status : status,
            total_price : total_price,
            created_at : created_at,
            updated_at : updated_at
        })

        const createdAgendamento = await db.collection(collectionAgendamentos).findOne({_id : result.insertedId})
       
        res.status(201).json({
            error: false,
            message: "Agendamento cadastrado com sucesso",
            createdAgendamento
        })
      } catch (error) {
        console.error("Problema ao criar um agendamento:", error)
        res.status(500).json({ error: true, message: "Falhou ao criar Agendamento" })
      }
}

// Update agendamento
export const updateAgendamento = async (req, res) => {
    try {
        const {id} = req.params
        const updatedData = req.body

        const db = req.app.locals.db

        const isAgendamentoAvailableToEdit = await db.collection(collectionAgendamentos).findOne({
            _id : new ObjectId(id),
            status : "scheduled"
        })

        if(!isAgendamentoAvailableToEdit){
            return res.status(400).json({
                error: true,
                message: "O agendamento não pode ser alterado pois já foi cancelado ou confirmado",
            })
        }

        if(updatedData.date){
            const existingAgendamento = await db.collection(collectionAgendamentos).findOne({
                date : updatedData.date,
                barber_name : updatedData.barber_name,
                status : {$ne : 'canceled'},
                _id : {$ne : new ObjectId(id)}
            })

            if(existingAgendamento){
                return res.status(409).json({
                    error: true,
                    message: "Outro agendamento já está marcado para essa data",
                })
            }
        }

        if(updatedData.services){
            updatedData.total_price = 0
            updatedData.services.forEach(service => {
                updatedData.total_price  += service.price
            });
        }

        updatedData.updated_at = getBrazilDate();

        const result = await db.collection(collectionAgendamentos).updateOne(
            {_id : new ObjectId(id)},
            {$set : updatedData}
        )

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: true, message: "Agendamento não encontrado" })
        }
        
        const updatedAgendamento = await db.collection(collectionAgendamentos).findOne({
            _id: new ObjectId(id),
        })
    
        res.status(200).json({
            error: false,
            message: "Agendamento atualizado com sucesso",
            updatedAgendamento
        })
    } catch (error) {
        console.error("Problema ao atualizar um agendamento:", error)
        res.status(500).json({ error: true, message: "Falhou ao atualizar Agendamento" })
    }
}

// Delete agendamento
export const deleteAgendamento = async (req, res) => {
    try {
        const {id} = req.params
        const db = req.app.locals.db
        const result = await db.collection(collectionAgendamentos).deleteOne({
            _id : new ObjectId(id)
        })

        if(result.deletedCount === 0)
            return res.status(404).json({
                error : true,
                message : 'Nenhum agendamento encontrado'
            })

        res.status(200).json({
            error: false,
            message: "Agendamento excluído com sucesso"
        })
        
    } catch (error) {
        console.error("Problema ao deletar um agendamento:", error)
        res.status(500).json({ error: true, message: "Falhou ao remover Agendamento" })
    }
}

export const cancelarAgendamento = async (req,res) => mudarStatusAgendamento(req,res,"canceled")

export const confirmarAgendamento = async (req,res) => mudarStatusAgendamento(req,res,"confirmed")

const mudarStatusAgendamento = async (req, res, newStatus) => {
    try {
        const {id} = req.params
        const db = req.app.locals.db
        const text = newStatus == 'canceled' ? 'cancelado' : 'confirmado' 
           
        const result = await db.collection(collectionAgendamentos).updateOne(
            {
                _id : new ObjectId(id), 
                status : "scheduled"
            },
            {
                $set : {
                    status : newStatus,
                    updated_at : new Date().toISOString()
                }
            }
        )
        if(result.modifiedCount === 0){
            res.status(404).json({
                error : true,
                message : `Agendamento não encontrado ou já ${text}`
            })
            return
        }

        const updatedAgendamento = await db.collection(collectionAgendamentos).findOne({
            _id : new ObjectId(id)
        })

        res.status(200).json({
            error: false,
            message : `Agendamento ${text} com sucesso`,
            data : updatedAgendamento
        })
    } catch (error) {
        console.error(`Agendamento não ${text}, ocorreu um problema ao alterar o status, : `, error)
        res.status(500).json({ error: true, message: `Agendamento não ${text}, ocorreu um erro ao alterar status, ` })
    }
}

const getBrazilDate = () => {
    const date = new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour12: false
    });
    
    const [d, t] = date.split(", ");
    const [day, month, year] = d.split("/");
    return `${year}-${month}-${day} ${t}`;
}