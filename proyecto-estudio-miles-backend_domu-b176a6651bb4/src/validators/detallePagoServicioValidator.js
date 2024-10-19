const Joi = require('joi');

const RegistrarDetallePagoServicioSchema = Joi.object({
    id_alquiler: Joi.number().integer().required().messages({
        'number.base': 'El ID del alquiler debe ser un número entero.',
        'number.integer': 'El ID del alquiler debe ser un número entero.',
        'any.required': 'El ID del alquiler es obligatorio.'
    }),
    id_pago_alquiler: Joi.number().integer().required().messages({
        'number.base': 'El ID del pago del alquiler debe ser un número entero.',
        'number.integer': 'El ID del pago del alquiler debe ser un número entero.',
        'any.required': 'El ID del pago del alquiler es obligatorio.'
    }),
    id_servicio: Joi.number().integer().required().messages({
        'number.base': 'El ID del servicio debe ser un número entero.',
        'number.integer': 'El ID del servicio debe ser un número entero.',
        'any.required': 'El ID del servicio es obligatorio.'
    }),
    monto: Joi.number().min(0).required().messages({
        'number.base': 'El monto del servicio debe ser un número.',
        'number.max': 'El monto del servicio debe ser mayor o igual a 0.',
        'any.required': 'El monto del servicio es obligatorio.'
    })
});

module.exports = {
    RegistrarDetallePagoServicioSchema
};