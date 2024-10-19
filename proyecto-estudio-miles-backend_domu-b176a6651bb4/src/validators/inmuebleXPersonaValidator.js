const Joi = require('joi');

const personaInmuebleSchema = Joi.object({
    id_inmueble: Joi.number().integer().required().messages({
        'number.base': 'La selección de Inmueble no es válida.',
        'number.integer': 'La clave del Inmueble debe ser un número entero.',
        'any.required': 'La selección de Inmueble es obligatoria.'
    }),
    dni_persona: Joi.number().integer().required().messages({
        'number.base': 'El DNI de una Persona debe ser un número.', 
        'number.integer': 'El DNI de una Persona debe ser un número entero.',       
        'any.required': 'El DNI de una Persona es obligatorio.'
    })
});

module.exports = {
    personaInmuebleSchema
}