import express from "express"
import {
    getAgendamentos,
    getAgendamentoById,
    createAgendamento,
    updateAgendamento,
    deleteAgendamento,
    mudarStatusAgendamento
} from "../controllers/agendamentos.js"
import { validateAgendamento, validateObjectId, validateStatusChange, validateUpdateAgendamento } from "../middleware/validation.js"
import auth from "../middleware/auth.js"

const router = express.Router()

router.use(auth)

// Get all agendamentos
router.get("/", getAgendamentos)

// // Get agendamento by ID
router.get("/:id",validateObjectId, getAgendamentoById)

// // Create new agendamento
router.post("/",validateAgendamento, createAgendamento)

// // Update agendamento
router.put("/:id",validateObjectId, validateUpdateAgendamento, updateAgendamento)

// Patch status de um agendamento para cancelado
router.patch("/:id/status",validateObjectId, validateStatusChange, mudarStatusAgendamento)

// // Delete agendamento
router.delete("/:id", validateObjectId, deleteAgendamento)

export default router