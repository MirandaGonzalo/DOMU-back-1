const Joi = require('joi');

const registrarLiquidacionSchema = Joi.object({
    fecha_liquidacion: Joi.date().iso().required().messages({
        'any.required': 'La fecha de liquidacion es obligatoria.',
        'date.iso': 'La fecha de liquidacion debe tener un formato válido.'
    }),
    porcentaje_comision: Joi.number().greater(0).required().messages({
        'any.required': 'El porcentaje de comision es obligatorio.',
        'number.greater': 'La porcentaje de comision debe ser mayor a 0.',
        'number.base': 'La porcentaje de comision debe ser un número.'
    }),
    id_forma_de_pago: Joi.number().integer().required().messages({
        'number.base': 'El ID de forma de pago debe ser un número entero.',
        'number.integer': 'El ID de forma de pago debe ser un número entero.',
        'any.required': 'El ID de forma de pago es obligatorio.'
    }),
    id_moneda: Joi.number().integer().required().messages({
        'number.base': 'El ID de moneda debe ser un número entero.',
        'number.integer': 'El ID de moneda debe ser un número entero.',
        'any.required': 'El ID de moneda es obligatorio.'
    }),
    observacion: Joi.string().max(100).optional().messages({
        'string.base': 'La observación debe ser un texto.',
        'string.max': 'La observación debe tener como máximo 100 caracteres.'
    }),
});


module.exports = {
    registrarLiquidacionSchema,

};