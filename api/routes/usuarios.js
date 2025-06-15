import express from "express"

import {
    createUsuarios,
    deleteUsuario,
    login,
    editUsuario,
    getActiveUser
}from "../controllers/usuarios.js"
import {validateUpdateUser, validateUser, validateUserLogin} from "../middleware/validation.js"
import auth from "../middleware/auth.js"

const router = express.Router()

// // Get usuario by ID
router.get("/", auth, getActiveUser)

// // Fazer login do usuário
router.post("/login", validateUserLogin, login)

// // Create new usuario
router.post("/", validateUser,createUsuarios)

router.put("/", auth, validateUpdateUser, editUsuario)

// // Delete agendamento
router.delete("/", auth, deleteUsuario)

export default router