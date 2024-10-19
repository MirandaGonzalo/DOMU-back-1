const Joi = require('joi');

const FormaPagoSchema = Joi.object({
    nombre: Joi.string().max(20).required().messages({
        'string.base': 'El campo "nombre" debe ser una cadena de texto.',
        'string.max': 'El campo "nombre" no puede tener más de 20 caracteres.',
        'any.required': 'El campo "nombre" es obligatorio.'
    }),
    descripcion: Joi.string().max(50).allow(null).messages({
        'string.max': 'La descripción no debe exceder los {#limit} caracteres.'
    }),
});

module.exports = {
    FormaPagoSchema
};