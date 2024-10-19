const Joi = require('joi');

const MonedaSchema = Joi.object({
    nombre: Joi.string().max(20).required().messages({
        'string.base': 'El campo "nombre" debe ser una cadena de texto.',
        'string.max': 'El campo "nombre" no puede tener más de 20 caracteres.',
        'any.required': 'El campo "nombre" es obligatorio.'
    }),
    descripcion: Joi.string().max(20).required().messages({
        'string.base': 'El campo "simbolo" debe ser una cadena de texto.',
        'string.max': 'El campo "simbolo" no puede tener más de 20 caracteres.',
        'any.required': 'El campo "simbolo" es obligatorio.'
    }),
});

module.exports = {
    MonedaSchema
};