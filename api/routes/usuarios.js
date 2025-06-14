import express from "express"

import {
    getUsuariosById,
    createUsuarios,
    deleteUsuario,
    login,
    editUsuario
}from "../controllers/usuarios.js"
import {validateObjectId, validateUpdateUser, validateUser, validateUserLogin} from "../middleware/validation.js"
import auth from "../middleware/auth.js"

const router = express.Router()

// // Get usuario by ID
router.get("/:id",validateObjectId, auth, getUsuariosById)

// // Fazer login do usuário
router.post("/login", validateUserLogin, login)

// // Create new usuario
router.post("/", validateUser,createUsuarios)

router.put("/:id", validateObjectId, auth, validateUpdateUser, editUsuario)

// // Delete agendamento
router.delete("/:id", validateObjectId, auth, deleteUsuario)

export default router