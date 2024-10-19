const Joi = require('joi');

const viviendaSchema = Joi.object({
    id_inmueble: Joi.number().integer().required().messages({
        'number.base': 'El id_inmueble debe ser un número.',
        'number.integer': 'El id_inmueble debe ser un número entero.',
        'any.required': 'El id_inmueble es un campo obligatorio.'
    }),
    cantidad_dormitorios: Joi.number().integer().allow(null).messages({
        'number.base': 'La cantidad de dormitorios debe ser un número.',
        'number.integer': 'La cantidad de dormitorios debe ser un número entero.'
    }),
    cantidad_dormitorios_suites: Joi.number().integer().allow(null).messages({
        'number.base': 'La cantidad de dormitorios suites debe ser un número.',
        'number.integer': 'La cantidad de dormitorios suites debe ser un número entero.'
    }),
    cantidad_toilette: Joi.number().integer().allow(null).messages({
        'number.base': 'La cantidad de toilettes debe ser un número.',
        'number.integer': 'La cantidad de toilettes debe ser un número entero.'
    }),
    living: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de living debe ser verdadero o falso.'
    }),
    balcon: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de balcón debe ser verdadero o falso.'
    }),
    pileta: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de pileta debe ser verdadero o falso.'
    }),
    lavadero: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de lavadero debe ser verdadero o falso.'
    }),
    vestidor: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de vestidor debe ser verdadero o falso.'
    }),
    mascotas: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de mascotas debe ser verdadero o falso.'
    }),
    hall: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de hall debe ser verdadero o falso.'
    })
});

module.exports = { 
    viviendaSchema 
};