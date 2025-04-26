import { MongoClient } from "mongodb"
let db;
export async function connectToDatabase(app){
    try{
        const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Pazetti:vxDjuUsOo9Bnu45F@barbearia.ckw5xnq.mongodb.net/"
        const client = new MongoClient(MONGODB_URI)
        await client.connect()
        console.log('Conectado ao MongoDB!')
        db = client.db()
        //Disponibiliza o db globalmente no Express
        app.locals.db = db
        return db
    } catch (error){
        console.error('Falha ao conectar ao MongoDB', error)
        process.exit(1)
    }
}

export {db}