import express from "express"

import {
    getUsuariosById,
    createUsuarios,
    deleteUsuario,
}from "../controllers/usuarios.js"
import {validateObjectId} from "../middleware/validation.js"

const router = express.Router()

// // Get usuario by ID
router.get("/:id",validateObjectId, getUsuariosById)

// // Create new usuario
router.post("/", createUsuarios)

// // Delete agendamento
router.delete("/:id", validateObjectId, deleteUsuario)

export default router