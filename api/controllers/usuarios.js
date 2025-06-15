import { ObjectId } from "mongodb"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';

dotenv.config();

const collectionUsuarios = 'usuarios'
const collectionAgendamentos = 'agendamentos'


// Get usuarios by ID
export const getUsuariosById = async (req, res) => {
    try {
        const {id} = req.params
        const db = req.app.locals.db

        const usuarios = await db.collection(collectionUsuarios).findOne({
            _id : new ObjectId(id)
        })

        if (!usuarios) 
            return res.status(404).json({ error: true, message: "Nenhum usuário encontrado" })
        
        res.status(200).json(usuarios)
    } catch (error) {
        console.error("Erro inesperado ao procurar usuário:", error)
        res.status(500).json({ error: true, message: "Erro inesperado ao procurar usuário, tente novamente" })
    }
}

// Get usuarios by ID
export const login = async (req, res) => {
    try {
        const {email, password} = req.body
        const db = req.app.locals.db

        const existingUser = await db.collection(collectionUsuarios).findOne({
            email : email
        })
        if (!existingUser) 
            return res.status(404).json({ error: true, message: "Esse email não foi cadastrado" })
              
    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password)
        if(!isPasswordCorrect){
            return res.status(403).json({
                error: true,
                message: 'Usuario ou Senha errado',
                data: existingUser
            })
        }

               // // Gerar token JWT
             const token = jwt.sign(
            { usuario: { id: existingUser.id } },
            process.env.SECRET_KEY,
            { expiresIn: process.env.EXPIRES_IN },
            (err, token) => {
                if(err) throw err
                res.status(200).json({
                    access_token: token,
                    msg: 'Login efetuado com sucesso'
                })
            }
        )
    } catch (error) {
        console.error("Erro inesperado ao procurar usuário:", error)
        res.status(500).json({ error: true, message: "Erro inesperado ao procurar usuário, tente novamente" })
    }
}

// Create new usuarios
export const createUsuarios = async (req, res) => {
    try {
        const db = req.app.locals.db

        const { name,email, password, nivel} = req.body
            //Checando se já existe um usuario

        const existingUser = await db.collection(collectionUsuarios).findOne({
            $or : [
                {name : {$regex : name, $options : "i"}},
                {email : email}
            ]
        })
        
        if(existingUser){
            if(name.toLowerCase() == existingUser.name.toLowerCase()){
                res.status(409).json({
                    error : true,
                    message: 'Um cadastro já foi realizado com esse nome'
                })
                return;
            }

            if(email == existingUser.email){
                res.status(409).json({
                    error : true,
                    message: 'Um cadastro já foi realizado com esse email'
                })
                return;
            }
        }
// Criptografia da senha
const salt = await bcrypt.genSalt(10)
const passwordEncrypted = await bcrypt.hash(password, salt)

const result = await db.collection(collectionUsuarios).insertOne({
    name: name,
    email: email,
    password: passwordEncrypted,
    nivel: nivel ? nivel : 0
})

      
        res.status(201).json({
            error: false,
            message: "Cadastro realizado com sucesso",
            data:{
                _id: result.insertedId,
                name : name,
                email: email,
                password : password,
                nivel : nivel
            }
        })

    } catch (error) {
        console.error("Erro inesperado ao cadastrar um usuário:", error)
        res.status(500).json({ error: true, message: "Ocorreu um erro ao cadastrar, tente novamente" })
    }
}

 // Delete usuario
 export const deleteUsuario = async (req, res) => {
    try {
        const {id} = req.params
        const db = req.app.locals.db
        
        const user = await db.collection(collectionUsuarios).findOne({_id : new ObjectId(id)})

        if(!user){
            return res.status(404).json({
                error : true,
                message : 'Nenhum usuario encontrado'
            })
        }
        const result = await db.collection(collectionUsuarios).deleteOne({
            _id : new ObjectId(id)
        })

        if(result.deletedCount === 0){
            throw new Error();
        }

        await db.collection(collectionAgendamentos).deleteMany({
            client_name : user.name,
            status : 'scheduled'
        })
            
        res.status(200).json({
            error : false,
            message : 'Usuário excluído com sucesso'
        })
        
    } catch (error) {
        console.error("Erro inesperado ao excluir usuário:", error)
        res.status(500).json({ error: true, message: "Erro inesperado ao excluir usuário, tente novamente" })
    }
}

export const editUsuario = async (req, res) => {
    try {
        const { id } = req.params
        const {newPassword, newName, ...updatedData} = req.body

        const db = req.app.locals.db

        const user = await db.collection(collectionUsuarios).findOne({
            _id : new ObjectId(id)
        })

        //Verificação de usuário encontrado
        if(!user){
            res.status(404).json({error : true, message : 'Nenhum usuário encontrado'})
            return;
        }

        //Verificação de Senha correta
        if(updatedData.password != user.password){
            res.status(401).json({
                error : true,
                message : 'A senha informada está incorreta'
            })
            return;
        }

        let existingUser;

        //Verificação de nome ou email duplicados
        if(updatedData.name || updatedData.email){
            existingUser = await db.collection(collectionUsuarios).findOne({
                _id : {$ne : new ObjectId(id)},
                $or : [
                    {name : {$regex : updatedData.name, $options : "i"}},
                    {email : updatedData.email}
                ]
            })
        }
        
        if(existingUser){
            //Nome duplicado
            if(updatedData.name && updatedData.name.toLowerCase() == existingUser.name.toLowerCase()){
                res.status(409).json({
                    error : true,
                    message: 'Já existe um usuário com esse nome'
                })
                return;
            }

            //Email duplicado
            if(updatedData.email && updatedData.email == existingUser.email){
                res.status(409).json({
                    error : true,
                    message: 'Já existe um usuário com esse email'
                })
                return;
            }
        }

        //Atualizando a senha para a nova senha informada
        if(newPassword){
           //Criptografia da senha
         const salt = await bcrypt.genSalt(10)
        const passwordEncrypted = await bcrypt.hash(newPassword, salt)
        
            updatedData.password = passwordEncrypted
        }

        const result = await db.collection(collectionUsuarios).updateOne(
            {_id : new ObjectId(id)},
            {$set : updatedData}
        )

        if(result.matchedCount === 0){
            res.status(404).json({
                error : true,
                message : 'Nenhum usuário encontrado'
            })
            return;
        }

        const updated = await db.collection(collectionUsuarios).findOne({
            _id : new ObjectId(id)
        })

        //Verificando se um novo nome foi passado para corrigir o nome do cliente 
        if(updatedData.name){
            await db.collection(collectionAgendamentos).updateMany({
                client_name : user.name //Nome antigo
            }, {$set : {client_name : updated.name}}) //Nome novo
        }

        res.status(200).json({
            error : false,
            message : 'Usuário atualizado com sucesso',
            data : updated
        })
    } catch (error) {
        res.status(500).json({
            error : true,
            message : 'Ocorreu um erro inesperado ao atualizar o usuário, tente novamente'
        })
        
        console.error(error)
    }

    
}