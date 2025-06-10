import { check, param, validationResult } from "express-validator"

// Middleware para verificar resultados da validação
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: "Ocorreu um erro de validação",
      errors: errors.array(),
    })
  }
  next()
}

// Validar ObjectId
export const validateObjectId = [param("id").isMongoId().withMessage("Formato de ID inválido"), validateRequest]

// Validações para a criação de agendamento
export const validateAgendamento = [
  //Nome do Cliente
  check('client_name')
    .notEmpty()
    .withMessage('O nome do cliente não pode estar vazio')
    .isLength({ max: 50 })
    .withMessage("O nome do cliente deve ter no máximo 50 caracteres"),
  //Nome do barbeiro
  check('barber_name')
    .notEmpty()
    .withMessage('O nome do barbeiro não pode estar vazio')
    .isLength({ max: 50 })
    .withMessage("O nome do barbeiro deve ter no máximo 50 caracteres")
    .matches(/^[A-Za-zÀ-ú\s()\-.,'"!?]+$/, "i")
    .withMessage("O nome do barbeiro deve conter apenas letras, espaços e caracteres especiais válidos"),
  //Services
  check('services')
    .notEmpty()
    .withMessage("O campo services é obrigatório")
    .isArray(),
  check('services.*.name')
    .notEmpty()
    .withMessage("O campo services deve ter um nome"),
  check('services.*.price')
    .notEmpty()
    .withMessage("O campo services deve ter um preço")
    .isFloat({ gt: 0 })
    .withMessage("O preço deve ser maior do que zero"),
  check('date')
    .notEmpty().withMessage("A data é obrigatória")
    .matches(/^(\d{4})\-(\d{2})\-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/)
    .withMessage('A data precisa estar no formato YYYY-MM-DD HH:mm:ss')
    .custom((date) => {
      if (!date) return
      const hours = date.substring(11, 13)
      const minutes = date.substring(14, 16)
      const seconds = date.substring(17, 19)

      const hourCondition = hours >= 8 && hours <= 18
      const minuteCondition = hours == 18 ? minutes == 0 : minutes == 0 || minutes == 30
      const secondsCondition = seconds == 0
      if (hourCondition && minuteCondition && secondsCondition) return true
      throw new Error("Data inválida, deve estar entre 08:00:00 e 18:00:00")

    }),
  check('total_price')
    .custom((total_price) => {
      if(total_price != undefined) throw new Error("O preço total deve ser calculado automaticamente")
      return true
    }),
  check('status')
    .custom((status) => {
      if(status != undefined) throw new Error("O status deve ser definido automaticamente")
      return true
    }),
  check('created_at')
    .custom((created_at) => {
      if(created_at != undefined) throw new Error("O campo created_at deve ser definido automaticamente")
      return true
    }),
  check('updated_at')
    .custom((updated_at) => {
      if(updated_at != undefined) throw new Error("O campo updated_at deve ser definido automaticamente")
      return true
    }),
  // Aplica as validações
  validateRequest,
]

// Validações para atualização parcial do agendamento (PUT/PATCH)
export const validateUpdateAgendamento = [
  //Nome do Cliente
  check('client_name')
  .optional()
  .custom((client_name) => {
    if(client_name === undefined) return true
    throw new Error('O nome do cliente não pode ser alterado')
  }),
  //Nome do barbeiro
  check('barber_name')
    .optional()
    .notEmpty()
    .withMessage('O nome do barbeiro não pode estar vazio')
    .isLength({ max: 50 })
    .withMessage("O nome do barbeiro deve ter no máximo 50 caracteres"),
  //Services
  check('services')
    .optional()
    .custom((services) => {
      if (!Array.isArray(services)) throw new Error("O campo services deve ser um array")
      if (services) {
        services.forEach((service, i) => {
          const errors = {
            name: false,
            price: false
          }

          if (!service.name || typeof (service.name) != "string") {
            errors.name = true
          }

          if (!service.price || typeof (service.price) != "number" || services.price <= 0) {
            errors.price = true
          }

          if (errors.name && errors.price)
            throw new Error(`Erro na posição services[${i}], o array services deve ter um nome e preço válidos`)
          else if (errors.name) {
            throw new Error(`Erro na posição services[${i}], o array services deve ter um nome válido`)
          }
          else if (errors.price) {
            throw new Error(`Erro na posição services[${i}], o array services deve ter um preço válido`)
          }
        });
      }
      return true;
    }),
  check('date')
    .optional()
    .matches(/^(\d{4})\-(\d{2})\-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/)
    .withMessage('A data precisa estar no formato YYYY-MM-DD HH:mm:ss')
    .custom((date) => {
      if (!date) return

      // Verifica se a data é válida
      const parsedDate = new Date(date.replace(' ', 'T'));
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Data inválida, verifique se ela existe de fato");
      }

      //Verificando se o horário é possível dentro do intervalo da nossa barbearia
      const hours = date.substring(11, 13)
      const minutes = date.substring(14, 16)
      const seconds = date.substring(17, 19)

      const hourCondition = hours >= 8 && hours <= 18
      const minuteCondition = hours == 18 ? minutes == 0 : minutes == 0 || minutes == 30
      const secondsCondition = seconds == 0
      if (hourCondition && minuteCondition && secondsCondition) return true
      throw new Error("Data inválida, deve estar entre 08:00:00 e 18:00:00")

    }),
  check('total_price')
    .custom((total_price) => {
      if(total_price != undefined) throw new Error("O preço total deve ser calculado automaticamente")
      return true
    }),
  check('status')
    .custom((status) => {
      if(status != undefined) throw new Error("O status deve ser definido automaticamente")
      return true
    }),
  check('created_at')
    .custom((created_at) => {
      if(created_at != undefined) throw new Error("O campo created_at deve ser definido automaticamente")
      return true
    }),
  check('updated_at')
    .custom((updated_at) => {
      if(updated_at != undefined) throw new Error("O campo updated_at deve ser definido automaticamente")
      return true
    }),
  // Aplica as validações
  validateRequest,
]


export const validateUser = [
  //Nome do Cliente
  check('name')
  .notEmpty()
  .withMessage("O nome do usuário não pode ser vazio"),
  check('email')
  .notEmpty()
  .withMessage('O email não pode ser vazio')
  .isEmail()
  .withMessage('Email inválido'),
  check('password')
  .notEmpty()
  .withMessage('A senha não pode ser vazia')
  .isLength({min:3})
  .withMessage('A senha é muito pequena'),
  check('nivel')
  .notEmpty()
  .withMessage('O campo é obrigatório')
  .isInt({min : 0, max: 2})
  .withMessage('O campo deve ser um valor entre 0 e 2'),
  validateRequest
]

export const validateUpdateUser = [
  //Nome do Cliente
  check('name')
  .optional()
  .notEmpty()
  .withMessage('O nome não pode ser vazio'),
  check('email')
  .optional()
  .notEmpty()
  .withMessage('O email não pode ser vazio')
  .isEmail()
  .withMessage('Email inválido'),
  check('password')
  .optional()
  .notEmpty()
  .withMessage('A senha não pode ser vazia')
  .isLength({min:3})
  .withMessage('A senha é muito pequena'),
  check('newPassword')
  .optional()
  .notEmpty()
  .withMessage('A nova senha não pode ser vazia')
  .isLength({min:3})
  .withMessage('A senha é muito pequena'),
  check('nivel')
  .optional()
  .custom((nivel) => {
    if(nivel === undefined) return true
    throw new Error('O nível não pode ser alterado')
  }),
  validateRequest
]

export const validateUserLogin = [
  //Nome do Cliente
  check('email')
  .notEmpty()
  .withMessage('O email não pode ser vazio')
  .isEmail()
  .withMessage('Email inválido'),
  check('password')
  .notEmpty()
  .withMessage('A senha não pode ser vazia')
  .isLength({min:3})
  .withMessage('A senha é muito pequena'),
  validateRequest
]