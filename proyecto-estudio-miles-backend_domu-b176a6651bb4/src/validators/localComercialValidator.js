const Joi = require('joi');

const localComercialSchema = Joi.object({
    id_inmueble: Joi.number().integer().required().messages({
        'number.base': 'El campo "id_inmueble" debe ser un número.',
        'number.integer': 'El campo "id_inmueble" debe ser un entero.',
        'any.required': 'El campo "id_inmueble" es obligatorio.'
    }),
    cortina_seguridad: Joi.boolean().optional().messages({
        'boolean.base': 'El campo "cortina_seguridad" debe ser verdadero o falso.'
    }),
    vidriera: Joi.boolean().optional().messages({
        'boolean.base': 'El campo "vidriera" debe ser verdadero o falso.'
    }),
    sala_de_estar: Joi.boolean().optional().messages({
        'boolean.base': 'El campo "sala_de_estar" debe ser verdadero o falso.'
    })
});

module.exports = { 
    localComercialSchema 
};