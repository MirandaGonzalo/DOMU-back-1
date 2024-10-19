const Joi = require('joi');

const ServicioSchema = Joi.object({
  nombre: Joi.string().max(60).required().messages({
    'string.base': 'El campo "nombre" debe ser una cadena de texto.',
    'string.max': 'El campo "nombre" no puede tener más de 60 caracteres.',
    'any.required': 'El campo "nombre" es obligatorio.'
  })
});

module.exports = {
    ServicioSchema
  };