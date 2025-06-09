import { MongoClient } from "mongodb"

import dotenv from 'dotenv';

dotenv.config();
let db;
export async function connectToDatabase(app){
    try{
        const MONGODB_URI = "mongodb://localhost:27017/barbearia"
        const client = new MongoClient(MONGODB_URI)
        await client.connect()
        console.log('Conectado ao MongoDB!')
        db = client.db('barbearia')
        //Disponibiliza o db globalmente no Express
        app.locals.db = db
        return db
    } catch (error){
        console.error('Falha ao conectar ao MongoDB', error)
        process.exit(1)
    }
}

export {db}