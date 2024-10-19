const Joi = require('joi');

const GarantiaSchema = Joi.object({
    id_alquiler: Joi.number().integer().required().messages({
        'number.base': 'El ID de alquiler debe ser un número entero.',
        'number.integer': 'El ID de alquiler debe ser un número entero.',
        'any.required': 'El ID de alquiler es obligatorio.'
    }),
    dni_responsable: Joi.number().integer().required().messages({
        'number.base': 'El DNI del responsable debe ser un número entero.',
        'number.integer': 'El DNI del responsable debe ser un número entero.',
        'any.required': 'El DNI del responsable es obligatorio.'
    }),
    tipo: Joi.number().integer().required().messages({
        'number.base': 'El tipo de garantía debe ser un número entero.',
        'number.integer': 'El tipo de garantía debe ser un número entero.',
        'any.required': 'El tipo de garantía es obligatorio.'
    }),
    numero_escritura: Joi.number().integer().optional().messages({
        'number.base': 'El numero de escritura debe ser un número entero.',
        'number.integer': 'El numero de escritura debe ser un número entero.',
        'any.required': 'El numero de escritura es obligatorio.'
    }),
});

module.exports = {
    GarantiaSchema
}