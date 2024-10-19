const Joi = require('joi');

const RegistrarVentaSchema = Joi.object({
    fecha_venta: Joi.date().iso().required().messages({
        'any.required': 'La fecha de venta es obligatoria.',
        'date.iso': 'La fecha de venta debe tener un formato válido.'
    }),
    id_inmueble: Joi.number().integer().required().messages({
        'number.base': 'El ID de inmueble debe ser un número entero.',
        'number.integer': 'El ID de inmueble debe ser un número entero.',
        'any.required': 'El ID de inmueble es obligatorio.'
    }),
    dni_comprador: Joi.number().integer().required().messages({
        'number.base': 'El DNI de comprador debe ser un número entero.',
        'number.integer': 'El DNI de comprador debe ser un número entero.',
        'any.required': 'El DNI de comprador es obligatorio.'
    }),
    monto_reserva: Joi.number().greater(0).required().messages({
        'any.required': 'El monto de reserva es obligatorio.',
        'number.greater': 'La monto de reserva debe ser mayor a 0.',
        'number.base': 'La monto de reserva debe ser un número.'
    }),
    precio_venta: Joi.number().greater(0).required().messages({
        'any.required': 'El precio de venta es obligatorio.',
        'number.greater': 'La precio de venta debe ser mayor a 0.',
        'number.base': 'La precio de venta debe ser un número.'
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
    porcentaje_comision: Joi.number().greater(0).required().messages({
        'any.required': 'El porcentaje de comision es obligatorio.',
        'number.greater': 'El porcentaje de comision debe ser mayor a 0.',
        'number.base': 'El porcentaje de comision debe ser un número.'
    }),
    observacion: Joi.string().max(100).optional().messages({
        'string.base': 'La observación debe ser un texto.',
        'string.max': 'La observación debe tener como máximo 100 caracteres.'
    })
});

const ModificarVentaSchema = Joi.object({
    fecha_venta: Joi.date().iso().required().messages({
        'any.required': 'La fecha de venta es obligatoria.',
        'date.iso': 'La fecha de venta debe tener un formato válido.'
    }),
    monto_reserva: Joi.number().greater(0).required().messages({
        'any.required': 'El monto de reserva es obligatorio.',
        'number.greater': 'La monto de reserva debe ser mayor a 0.',
        'number.base': 'La monto de reserva debe ser un número.'
    }),
    precio_venta: Joi.number().greater(0).required().messages({
        'any.required': 'El precio de venta es obligatorio.',
        'number.greater': 'La precio de venta debe ser mayor a 0.',
        'number.base': 'La precio de venta debe ser un número.'
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
    porcentaje_comision: Joi.number().greater(0).required().messages({
        'any.required': 'El porcentaje de comision es obligatorio.',
        'number.greater': 'El porcentaje de comision debe ser mayor a 0.',
        'number.base': 'El porcentaje de comision debe ser un número.'
    }),
    observacion: Joi.string().max(100).optional().messages({
        'string.base': 'La observación debe ser un texto.',
        'string.max': 'La observación debe tener como máximo 100 caracteres.'
    })
});

module.exports = {
    RegistrarVentaSchema,
    ModificarVentaSchema
};