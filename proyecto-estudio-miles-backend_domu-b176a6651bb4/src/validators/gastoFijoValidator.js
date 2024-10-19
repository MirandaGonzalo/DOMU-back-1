const Joi = require('joi');

const GastoFijoSchema = Joi.object({
    id_alquiler: Joi.number().integer().required().messages({
        'number.base': 'El ID de alquiler debe ser un número entero.',
        'number.integer': 'El ID de alquiler debe ser un número entero.',
        'any.required': 'El ID de alquiler es obligatorio.'
    }),
    id_servicio: Joi.number().integer().required().messages({
        'number.base': 'El ID de servicio debe ser un número entero.',
        'number.integer': 'El ID de servicio debe ser un número entero.',
        'any.required': 'El ID de servicio es obligatorio.'
    }),
    tipo_pago: Joi.number().integer().required().messages({
        'number.base': 'El tipo de pago debe ser un número entero.',
        'number.integer': 'El tipo de pago debe ser un número entero.',
        'any.required': 'El tipo de pago es obligatorio.'
    }),
    dia_vencimiento: Joi.number().integer().required().messages({
        'number.base': 'El dia de vencimiento del inquilino debe ser un número entero.',
        'number.integer': 'El dia de vencimiento del inquilino debe ser un número entero.',
        'any.required': 'El dia de vencimiento del inquilino es obligatorio.'
    }),
    numero_cliente: Joi.number().integer().messages({
        'number.base': 'El numero de cliente debe ser un número entero.',
        'number.integer': 'El numero de cliente debe ser un número entero.',
        'any.required': 'El numero de cliente es obligatorio.'
    }),
    numero_contrato: Joi.number().integer().messages({
        'number.base': 'El numero de contrato debe ser un número entero.',
        'number.integer': 'El numero de contrato debe ser un número entero.',
        'any.required': 'El numero de contrato es obligatorio.'
    })
});

module.exports = {
    GastoFijoSchema
}