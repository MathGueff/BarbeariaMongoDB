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
            return res.status(404).json({ error: true, message: "Usuario não encontrado" })
        
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

        const { name,
            email,
            password} = req.body

            //Checando se já existe um usuario
        const existingUsuario = await db.collection(collectionUsuarios).findOne(
            {email}
        )
        if (existingUsuario) {
            return res.status(409).json({
              error: true,
              message: "Já existe um usuario com esse login",
            })
          }

        const result = await db.collection(collectionUsuarios).insertOne({
            name : name,
            email: email,
            password : password
        })
      
        res.status(201).json({
            error: false,
            message: "Usuário cadastrado com sucesso",
            data:{
                _id: result.insertedId,
                name : name,
                email: email,
                password : password
            }
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

//Verificando login
export const userLogin = async (req, res) => {
    try {
        const db = req.app.locals.db

        const {
            email,
            password} = req.body

             //Checando se já existe uma senha
             const existingUsuario = await db.collection(collectionUsuarios).findOne(
                {email : email}
            )

            if (!existingUsuario) {
                return res.status(404).json({
                  error: true,
                  message: "Usuario não encontrado",
                })
              }

            if(existingUsuario.password !== password) {
                return res.status(400).json({
                    error: true,
                    message:"Senha invalida",
                  });
                }
            
        
         return res.status(200).json({
            error: false,
            message: "Autenticado",
            data:{
                name : existingUsuario.name,
                email: email,
                password : password,
                isAdmin: existingUsuario.isAdmin
            }
         });
       
        } catch (error) {
            console.error("Problema ao fazer login", error)
            res.status(500).json({ error: true, message: "Falhou ao fazer login" })
          }
}