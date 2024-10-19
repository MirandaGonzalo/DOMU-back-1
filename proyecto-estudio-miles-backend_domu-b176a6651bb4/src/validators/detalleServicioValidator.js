const Joi = require('joi');

// Definir el esquema de validación para Departamento
const detalleServicioSchema = Joi.object({
    id_inmueble: Joi.number().integer().required().messages({
        'number.base': 'La clave del Inmueble debe ser un número.',
        'number.integer': 'La clave del Inmueble debe ser un número entero.',
        'any.required': 'La clave del Inmueble es un campo obligatorio.'
    }),
    id_servicio: Joi.number().integer().required().messages({
        'number.base': 'La clave del Servicio debe ser un número.',
        'number.integer': 'La clave del Servicio debe ser un número entero.',
        'any.required': 'La clave del Servicio es un campo obligatorio.'
    }),
});

module.exports = { 
    detalleServicioSchema 
};