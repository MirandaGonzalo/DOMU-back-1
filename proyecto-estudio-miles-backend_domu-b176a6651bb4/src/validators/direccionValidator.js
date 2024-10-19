const Joi = require('joi');

const direccionSchema = Joi.object({
  numero: Joi.number().integer().required().messages({
    'number.base': 'El campo "numero" debe ser un número entero.',
    'number.empty': 'El campo "numero" no puede estar vacío.',
    'any.required': 'El campo "numero" es obligatorio.'
  }),
  calle: Joi.string().max(60).required().messages({
    'string.base': 'El campo "calle" debe ser una cadena de texto.',
    'string.max': 'El campo "calle" no puede tener más de 60 caracteres.',
    'any.required': 'El campo "calle" es obligatorio.'
  }),
  barrio: Joi.string().max(60).required().messages({
    'string.base': 'El campo "barrio" debe ser una cadena de texto.',
    'string.max': 'El campo "barrio" no puede tener más de 60 caracteres.',
    'any.required': 'El campo "barrio" es obligatorio.'
  }),
  localidad: Joi.string().max(60).required().messages({
    'string.base': 'El campo "localidad" debe ser una cadena de texto.',
    'string.max': 'El campo "localidad" no puede tener más de 60 caracteres.',
    'any.required': 'El campo "localidad" es obligatorio.'
  }),
  provincia: Joi.string().max(60).required().messages({
    'string.base': 'El campo "provincia" debe ser una cadena de texto.',
    'string.max': 'El campo "provincia" no puede tener más de 60 caracteres.',
    'any.required': 'El campo "provincia" es obligatorio.'
  }),
  piso: Joi.number().integer().optional().messages({
    'number.base': 'El campo "piso" debe ser un número entero.',
    'number.integer': 'La cuenta bancaria debe ser un número entero.'
  }),
  departamento: Joi.string().max(10).optional().messages({
    'string.base': 'El campo "departamento" debe ser una cadena de texto.',
    'string.max': 'El campo "departamento" no puede tener más de 10 caracteres.'
  }),
  codigo_postal: Joi.string().max(10).optional().messages({
    'string.base': 'El campo "codigo postal" debe ser una cadena de texto.',
    'string.max': 'El campo "codigo postal" no puede tener más de 10 caracteres.'
  })
});

const direccionUpdateSchema = Joi.object({
  numero: Joi.number().integer().required().messages({
    'number.base': 'El campo "numero" debe ser un número entero.',
    'any.required': 'El campo "numero" es obligatorio.'
  }),
  calle: Joi.string().max(60).required().messages({
    'string.base': 'El campo "calle" debe ser una cadena de texto.',
    'string.max': 'El campo "calle" no puede tener más de 60 caracteres.',
    'any.required': 'El campo "calle" es obligatorio.'
  }),
  barrio: Joi.string().max(60).required().messages({
    'string.base': 'El campo "barrio" debe ser una cadena de texto.',
    'string.max': 'El campo "barrio" no puede tener más de 60 caracteres.',
    'any.required': 'El campo "barrio" es obligatorio.'
  }),
  localidad: Joi.string().max(60).required().messages({
    'string.base': 'El campo "localidad" debe ser una cadena de texto.',
    'string.max': 'El campo "localidad" no puede tener más de 60 caracteres.',
    'any.required': 'El campo "localidad" es obligatorio.'
  }),
  provincia: Joi.string().max(60).required().messages({
    'string.base': 'El campo "provincia" debe ser una cadena de texto.',
    'string.max': 'El campo "provincia" no puede tener más de 60 caracteres.',
    'any.required': 'El campo "provincia" es obligatorio.'
  }),
  piso: Joi.number().integer().optional().messages({
    'number.base': 'El campo "piso" debe ser un número entero.',
    'number.integer': 'La cuenta bancaria debe ser un número entero.'
  }),
  departamento: Joi.string().max(10).optional().messages({
    'string.base': 'El campo "departamento" debe ser una cadena de texto.',
    'string.max': 'El campo "departamento" no puede tener más de 10 caracteres.'
  }),
  codigo_postal: Joi.string().max(10).optional().messages({
    'string.base': 'El campo "codigo postal" debe ser una cadena de texto.',
    'string.max': 'El campo "codigo postal" no puede tener más de 10 caracteres.'
  })
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar.'
});


module.exports = {
  direccionSchema,
  direccionUpdateSchema
};