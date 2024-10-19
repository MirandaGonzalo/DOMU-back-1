const Joi = require('joi');

const RegistrarPagoParcial = Joi.object({
    id_pago_alquiler: Joi.number().integer().required().messages({
        'number.base': 'El ID del pago debe ser un número entero.',
        'number.integer': 'El ID del pago debe ser un número entero.',
        'any.required': 'El ID del pago es obligatorio.'
    }),
    id_forma_de_pago: Joi.number().integer().required().messages({
        'number.base': 'El ID de la forma de pago debe ser un número entero.',
        'number.integer': 'El ID de la forma de pago debe ser un número entero.',
        'any.required': 'El ID de la forma de pago es obligatorio.'
    }),
    monto: Joi.number().greater(0).required().messages({
        'number.base': 'El monto del pago debe ser un número.',
        'number.greater': 'El monto del pago debe ser mayor a 0.',
        'any.required': 'El monto del pago es obligatorio.'
    }),
    fecha_pago: Joi.date().iso().required().messages({
        'any.required': 'La fecha del pago es obligatoria.',
        'date.iso': 'La fecha del pago debe tener un formato válido.'
    }),
    quien_paga: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo quien_paga debe ser verdadero o falso.'
    }),
    monto_mora: Joi.number().allow(null).messages({
        'number.base': 'El Monto de Mora debe ser un número.'
    }),
    observacion: Joi.string().max(100).allow(null).allow("").messages({
        'string.base': 'La observación debe ser un texto.',
        'string.max': 'La observación debe tener como máximo 100 caracteres.'
    })
});

const RegistrarCompletarPagoParcial = Joi.object({
    id_pago_alquiler: Joi.number().integer().required().messages({
        'number.base': 'El ID del pago debe ser un número entero.',
        'number.integer': 'El ID del pago debe ser un número entero.',
        'any.required': 'El ID del pago es obligatorio.'
    }),
    id_forma_de_pago: Joi.number().integer().required().messages({
        'number.base': 'El ID de la forma de pago debe ser un número entero.',
        'number.integer': 'El ID de la forma de pago debe ser un número entero.',
        'any.required': 'El ID de la forma de pago es obligatorio.'
    }),
    monto: Joi.number().min(0).required().messages({
        'number.base': 'El monto del pago debe ser un número.',
        'number.greater': 'El monto del pago debe ser como mínimo 0.',
        'any.required': 'El monto del pago es obligatorio.'
    }),
    fecha_pago: Joi.date().iso().required().messages({
        'any.required': 'La fecha del pago es obligatoria.',
        'date.iso': 'La fecha del pago debe tener un formato válido.'
    }),
    quien_paga: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo quien_paga debe ser verdadero o falso.'
    }),
    monto_mora: Joi.number().allow(null).messages({
        'number.base': 'El Monto de Mora debe ser un número.'
    }),
    observacion: Joi.string().max(100).allow(null).allow("").messages({
        'string.base': 'La observación debe ser un texto.',
        'string.max': 'La observación debe tener como máximo 100 caracteres.'
    })
});

module.exports = {
    RegistrarPagoParcial,
    RegistrarCompletarPagoParcial
};