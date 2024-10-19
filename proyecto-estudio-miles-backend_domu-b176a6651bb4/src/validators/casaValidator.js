const Joi = require('joi');

// Definir el esquema de validación para Casa
const casaSchema = Joi.object({
    id_vivienda: Joi.number().integer().required().messages({
        'number.base': 'El id_vivienda debe ser un número.',
        'number.integer': 'El id_vivienda debe ser un número entero.',
        'any.required': 'El id_vivienda es un campo obligatorio.'
    }),
    galeria: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de galería debe ser verdadero o falso.'
    }),
    patio_interno: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de patio interno debe ser verdadero o falso.'
    }),
    jardin: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de jardín debe ser verdadero o falso.'
    }),
    patio: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de patio debe ser verdadero o falso.'
    }),
    quincho: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de quincho debe ser verdadero o falso.'
    }),
    reja: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de reja debe ser verdadero o falso.'
    })
});

module.exports = { 
    casaSchema 
};