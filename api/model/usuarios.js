import { MongoClient } from 'mongodb'
import { readFileSync } from 'fs'// File System -> acessa arquivos
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv';


dotenv.config();
//PARA RODAR: npm run importUsuarios
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/barbearia"
const dbName = 'barbearia'
const collectionName = 'usuarios'

async function importUsuarios(){
    const client = new MongoClient(uri);
    try {
        await client.connect()
        const dados =  readFileSync('./api/json/usuarios.json', 'utf-8')
        const usuarios = JSON.parse(dados);

        if(!Array.isArray(usuarios))
            {throw new Error('O JSON deve conter um Array de objetos')}

        const db = client.db(dbName);
        const collection = db.collection(collectionName)
        
        console.log(`Alterando banco de dados em : ${uri}\n`)
        //Verificando se a collection já existe
        const collections = await db.listCollections({name : collectionName}).toArray()
        if(collections.length > 0){
            await collection.drop()
            console.log(`⚠ Coleção ${collectionName} foi dropada`)
        }
        console.log('Criptografando usuários...')
        const usuariosCriptografados = await Promise.all(
            usuarios.map(async (user) => {
                // Criptografia da senha
                const salt = await bcrypt.genSalt(10)
                user.password = await bcrypt.hash(user.password, salt)
                return user;
            })
        )
        const resultado = await collection.insertMany(usuariosCriptografados)
        console.log(`${resultado.insertedCount} documentos inseridos`)
    } catch(error){
        console.log('❌ Erro ao importar ', error.message)
    } finally {
        await client.close()
    }
}

importUsuarios();