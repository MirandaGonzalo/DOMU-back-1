const Joi = require('joi');

const RegistrarGastoExtraSchema = Joi.object({
    id_pago_alquiler: Joi.number().integer().required().messages({
        'number.base': 'El ID del pago del alquiler debe ser un número entero.',
        'number.integer': 'El ID del pago del alquiler debe ser un número entero.',
        'any.required': 'El ID del pago del alquiler es obligatorio.'
    }),
    descripcion: Joi.string().max(100).allow(null).messages({
        'string.base': 'La descripcion debe ser un texto.',
        'string.max': 'La descripcion debe tener como máximo 100 caracteres.',
        'any.required': 'El descripcion es obligatorio.'
    }),
    monto: Joi.number().min(0).required().messages({
        'number.base': 'El monto del gasto debe ser un número.',
        'number.max': 'El monto del gasto debe ser mayor o igual a 0.',
        'any.required': 'El monto del gasto es obligatorio.'
    }),
    quien_pago: Joi.number().required().messages({
        'number.base': 'El responsable de pago no es válido.',
        'number.max': 'El responsable de pago no es válido.',
        'any.required': 'El responsable de pago no es válido.'
    }),
    a_quien_cobrar: Joi.number().required().messages({
        'number.base': 'El responsable de cobro no es válido.',
        'number.max': 'El responsable de cobro no es válido.',
        'any.required': 'El responsable de cobro no es válido.'
    })
});

const RegistrarGastoPagoSchema = Joi.object({
    id: Joi.number().integer().required().messages({
        'number.base': 'El ID del gasto extra debe ser un número entero.',
        'number.integer': 'El ID del gasto extra debe ser un número entero.',
        'any.required': 'El ID del gasto extra es obligatorio.'
    }),
    descripcion: Joi.string().max(100).allow(null).messages({
        'string.base': 'La descripcion debe ser un texto.',
        'string.max': 'La descripcion debe tener como máximo 100 caracteres.',
        'any.required': 'El descripcion es obligatorio.'
    }),
    monto: Joi.number().min(0).required().messages({
        'number.base': 'El monto del gasto debe ser un número.',
        'number.max': 'El monto del gasto debe ser mayor o igual a 0.',
        'any.required': 'El monto del gasto es obligatorio.'
    }),
    quien_pago: Joi.number().required().messages({
        'number.base': 'El responsable de pago no es válido.',
        'number.max': 'El responsable de pago no es válido.',
        'any.required': 'El responsable de pago no es válido.'
    }),
    a_quien_cobrar: Joi.number().required().messages({
        'number.base': 'El responsable de cobro no es válido.',
        'number.max': 'El responsable de cobro no es válido.',
        'any.required': 'El responsable de cobro no es válido.'
    })
});

const RegistrarGastoNuevoPagoSchema = Joi.object({
    descripcion: Joi.string().max(100).allow(null).messages({
        'string.base': 'La descripcion del gasto extra nuevo debe ser un texto.',
        'string.max': 'La descripcion del gasto extra nuevo  debe tener como máximo 100 caracteres.',
        'any.required': 'El descripcion del gasto extra nuevo  es obligatorio.'
    }),
    monto: Joi.number().min(0).required().messages({
        'number.base': 'El monto del nuevo gasto debe ser un número.',
        'number.max': 'El monto del nuevo gasto debe ser mayor o igual a 0.',
        'any.required': 'El monto del nuevo gasto es obligatorio.'
    }),
    quien_pago: Joi.number().required().messages({
        'number.base': 'El responsable del nuevo pago no es válido.',
        'number.max': 'El responsable del nuevo pago no es válido.',
        'any.required': 'El responsable del nuevo pago no es válido.'
    }),
    a_quien_cobrar: Joi.number().required().messages({
        'number.base': 'El responsable de cobro del nuevo gasto extra no es válido.',
        'number.max': 'El responsable de cobro del nuevo gasto extra no es válido.',
        'any.required': 'El responsable de cobro del nuevo gasto extra no es válido.'
    })
});

module.exports = {
    RegistrarGastoExtraSchema,
    RegistrarGastoPagoSchema,
    RegistrarGastoNuevoPagoSchema
};