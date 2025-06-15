import jwt from 'jsonwebtoken'
const { TokenExpiredError } = jwt; // Correção aqui
export default async function auth(req, res , next) {
    const token = req.header('access_token');
    
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
        if(error instanceof TokenExpiredError){
            return res.status(403).json({
                error : true, message : 'O token JWT está expirado'
            })
        }
        res.status(403).json({
            error : true, message : 'O token JWT fornecido é inválido'
        })
    }
}