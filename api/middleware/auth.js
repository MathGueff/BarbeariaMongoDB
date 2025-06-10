import jwt from 'jsonwebtoken'
export default async function auth(req, res , next) {
    const token = req.header('access-token');
    if(!token){
        return res.status(401).json({
            error : true, message : 'Acesso negado, é obrigatório o envio do token JWT'
        })
    }
    try{
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        req.usuario = decoded.usuario 
        next() 
    }
    catch(error){
        res.status(403).json({
            error : true, message : 'Token inválido'
        })
    }
}