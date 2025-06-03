import express from "express"

import {
    getUsuariosById,
    createUsuarios,
    deleteUsuario,
    userLogin
}from "../controllers/usuarios.js"
import {validateObjectId, validateUser, validateUserLogin} from "../middleware/validation.js"

const router = express.Router()

// // Get usuario by ID
router.get("/:id",validateObjectId, getUsuariosById)

// // Fazer login do usuário
router.post("/login", validateUserLogin, userLogin)

// // Create new usuario
router.post("/", validateUser,createUsuarios)

// // Delete agendamento
router.delete("/:id", validateObjectId, deleteUsuario)

export default router