import { ObjectId } from "mongodb"

const collectionUsuarios = 'usuarios'

// Get usuarios by ID
export const getUsuariosById = async (req, res) => {
    try {
        const {id} = req.params
        const db = req.app.locals.db

        const usuarios = await db.collection(collectionUsuarios).findOne({
            _id : new ObjectId(id)
        })
        if (!usuarios) 
            return res.status(404).json({ error: true, message: "Usuarios não encontrado" })
        
        res.status(200).json(usuarios)
    } catch (error) {
        console.error("Falha ao procurar por usuario:", error)
        res.status(500).json({ error: true, message: "Falha ao procurar por usuarios" })
    }

    
}

// Create new usuarios
export const createUsuarios = async (req, res) => {
    try {
        const db = req.app.locals.db

        const { nome,
            login,
            senha} = req.body

            //Checando se já existe um usuario
        const existingUsuario = await db.collection(collectionUsuarios).findOne(
            {login}
        )
        if (existingUsuario) {
            return res.status(409).json({
              error: true,
              message: "Já existe um usuario com esse login",
            })
          }

          const newUsuario = {
            nome,
            login,
            senha
        }
        const result = await db.collection(collectionUsuarios).insertOne({
            ...newUsuario,
            nome : nome,
            login: login,
            senha : senha
        })
      
        res.status(201).json({
            _id: result.insertedId,
            ...newUsuario,
            nome : nome,
            login: login,
            senha : senha
        })
        } catch (error) {
            console.error("Problema ao criar um usuario:", error)
            res.status(500).json({ error: true, message: "Falhou ao criar Usuario" })
          }
}

 // Delete usuario
 export const deleteUsuario = async (req, res) => {
    try {
        const {id} = req.params
        const db = req.app.locals.db
        const result = await db.collection(collectionUsuarios).deleteOne({
            _id : new ObjectId(id)
        })

        if(result.deletedCount === 0)
            return res.status(404).json({
                error : true,
                message : 'Nenhum usuario encontrado'
            })

        res.status(200).json(result)
        
    } catch (error) {
        console.error("Problema ao deletar um usuario:", error)
        res.status(500).json({ error: true, message: "Falha ao remover usuario" })
    }
}