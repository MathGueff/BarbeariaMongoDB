import { MongoClient } from 'mongodb'
import { readFileSync } from 'fs'// File System -> acessa arquivos
import dotenv from 'dotenv';

dotenv.config();
//PARA RODAR: npm run importUsuarios
const uri =  process.env.MONGODB_URI || "mongodb://localhost:27017/barbearia"
const dbName = 'barbearia'
const collectionName = 'usuarios'

async function importausuarios(){
    const client = new MongoClient(uri);
    try {
        await client.connect()
        const dados =  readFileSync('./api/json/usuarios.json', 'utf-8')
        const usuarios = JSON.parse(dados);

        if(!Array.isArray(usuarios))
            {throw new Error('O JSON deve conter um Array de objetos')}

        const db = client.db(dbName);
        const collection = db.collection(collectionName)
        //Verificando se a collection já existe
        const collections = await db.listCollections({name : collectionName}).toArray()
        if(collections.length > 0){
            await collection.drop()
            console.log(`⚠ Coleção ${collectionName} foi dropada`)
        }
        const resultado = await collection.insertMany(usuarios)
        console.log(`${resultado.insertedCount} documentos inseridos`)
    } catch(error){
        console.log('❌ Erro ao importar ', error.message)
    } finally {
        await client.close()
    }
}

importausuarios();