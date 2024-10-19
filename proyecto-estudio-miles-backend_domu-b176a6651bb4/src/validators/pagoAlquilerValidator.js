const Joi = require('joi');

const RegistrarDevengarSchema = Joi.object({
    id_alquiler: Joi.number().integer().required().messages({
        'number.base': 'El ID del alquiler debe ser un número entero.',
        'number.integer': 'El ID del alquiler debe ser un número entero.',
        'any.required': 'El ID del alquiler es obligatorio.'
    }),
    id_estado: Joi.number().integer().required().messages({
        'number.base': 'El ID del estado debe ser un número entero.',
        'number.integer': 'El ID del estado debe ser un número entero.',
        'any.required': 'El ID del estado es obligatorio.'
    }),
    mes_correspondiente: Joi.string().max(7).required().messages({
        'string.base': 'El período debe ser un texto.',
        'string.max': 'El período debe tener como máximo 7 caracteres.',
        'any.required': 'El período es obligatorio.'
    }),
    precio_alquiler: Joi.number().greater(0).required().messages({
        'number.base': 'El monto del alquiler debe ser un número.',
        'number.greater': 'El monto del alquiler debe ser mayor a 0.',
        'any.required': 'El monto del alquiler es obligatorio.'
    }),
    observacion: Joi.string().max(100).allow(null).messages({
        'string.base': 'La observación debe ser un texto.',
        'string.max': 'La observación debe tener como máximo 100 caracteres.',
        'any.required': 'El nombre es obligatorio.'
    })
});


module.exports = {
    RegistrarDevengarSchema
};