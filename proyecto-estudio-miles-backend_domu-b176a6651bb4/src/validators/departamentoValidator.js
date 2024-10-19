const Joi = require('joi');

// Definir el esquema de validación para Departamento
const departamentoSchema = Joi.object({
    id_vivienda: Joi.number().integer().required().messages({
        'number.base': 'El id_vivienda debe ser un número.',
        'number.integer': 'El id_vivienda debe ser un número entero.',
        'any.required': 'El id_vivienda es un campo obligatorio.'
    }),
    summ: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de summ debe ser verdadero o falso.'
    }),
    ascensor: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de ascensor debe ser verdadero o falso.'
    }),
    patio_en_comun: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de patio en común debe ser verdadero o falso.'
    }),
    cantidad_pisos_edificio: Joi.number().integer().required().messages({
        'number.base': 'La cantidad de pisos del edificio debe ser un número.',
        'number.integer': 'La cantidad de pisos del edificio debe ser un número entero.',
        'any.required': 'La cantidad de pisos del edificio es un campo obligatorio.'
    }),
    gimnasio: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de gimnasio debe ser verdadero o falso.'
    }),
    solarium: Joi.boolean().allow(null).messages({
        'boolean.base': 'El valor de solarium debe ser verdadero o falso.'
    })
});

module.exports = { 
    departamentoSchema 
};