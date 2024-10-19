const Joi = require('joi');

const aptoInmuebleSchema = Joi.object({
    id_inmueble: Joi.number().integer().required().messages({
        'number.base': 'La selección de Inmueble no es válida.',
        'number.integer': 'La clave del Inmueble debe ser un número entero.',
        'any.required': 'La selección de Inmueble es obligatoria.'
    }),
    id_apto: Joi.number().integer().required().messages({
        'number.base': 'La selección de Apto debe ser un número.', 
        'number.integer': 'La selección de Apto debe ser un número entero.',       
        'any.required': 'La selección de Apto es obligatorio.'
    })
});

module.exports = {
    aptoInmuebleSchema
}