const Joi = require('joi');

const { Sequelize } = require('sequelize');
const sequelize = require('../../config/connection'); 
const { models } = require('../models/index');

const Estado = models.Estado;

const PersonaEstadoSchema = Joi.object({
  dni: Joi.number().integer().required().messages({
    'number.base': 'El DNI debe ser un número entero.',
    'number.integer': 'El DNI debe ser un número entero.',
    'any.required': 'El DNI es obligatorio.'
  }),
});

const PersonaSchema = Joi.object({
  dni: Joi.number().integer().required().messages({
    'number.base': 'El DNI debe ser un número entero.',
    'number.integer': 'El DNI debe ser un número entero.',
    'any.required': 'El DNI es obligatorio.'
  }),
  nombre: Joi.string().max(100).required().messages({
    'string.base': 'El nombre debe ser un texto.',
    'string.max': 'El nombre debe tener como máximo 100 caracteres.',
    'any.required': 'El nombre es obligatorio.'
  }),
  cuit: Joi.number().integer().required().custom((value, helpers) => {
    const { dni } = helpers.state.ancestors[0]; // Obtener el valor de dni del objeto principal
    const dniStr = dni.toString();
    const cuitStr = value.toString();
    if (!cuitStr.includes(dniStr)) {
      return helpers.message('El CUIT debe contener el DNI de la persona');
    }
    return value;
  }).messages({
    'number.base': 'El CUIT debe ser un número entero.',
    'number.empty': 'El CUIT es obligatorio.',
    'number.integer': 'El CUIT debe ser un número entero',
    'any.required': 'El CUIT es obligatorio.'
  }),
  celular: Joi.number().integer().required().messages({
    'number.base': 'El celular debe ser un número entero.',
    'number.empty': 'El celular es obligatorio.',
    'number.integer': 'El celular debe ser un número entero.',
    'any.required': 'El celular es obligatorio.'
  }),
  celular_secundario: Joi.number().integer().optional().messages({
    'number.base': 'El celular secundario debe ser un número entero.',
    'number.integer': 'El celular secundario debe ser un número entero.'
  }),
  cuenta_banco: Joi.string().length(22).optional().messages({
    'string.length': 'La cuenta bancaria debe tener exactamente 22 caracteres.'
  }),
  condicion_iva: Joi.string().max(10).optional().messages({
    'string.base': 'La condición de IVA debe ser un texto.',
    'string.max': 'La condición de IVA debe tener como máximo 10 caracteres.'
  }),
  observacion: Joi.string().max(100).optional().messages({
    'string.base': 'La observación debe ser un texto.',
    'string.max': 'La observación debe tener como máximo 100 caracteres.'
  }),
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
      'any.required': 'El email es obligatorio.',
      'string.email': 'El email debe tener un formato válido.',
  }),
  ocupacion: Joi.string().max(50).optional().messages({
    'string.base': 'La ocupacion debe ser un texto.',
    'string.max': 'La ocupacion debe tener como máximo 50 caracteres.'
  })
});

const RegistrarPersonaSchema = Joi.object({
  dni: Joi.number().integer().required().messages({
    'number.base': 'El DNI debe ser un número entero.',
    'number.integer': 'El DNI debe ser un número entero.',
    'any.required': 'El DNI es obligatorio.'
  }),
  nombre: Joi.string().max(100).required().messages({
    'string.base': 'El nombre debe ser un texto.',
    'string.max': 'El nombre debe tener como máximo 100 caracteres.',
    'any.required': 'El nombre es obligatorio.'
  }),
  cuit: Joi.number().integer().required().custom((value, helpers) => {
    const { dni } = helpers.state.ancestors[0]; // Obtener el valor de dni del objeto principal
    const dniStr = dni.toString();
    const cuitStr = value.toString();
    if (!cuitStr.includes(dniStr)) {
        return helpers.message('El CUIT debe contener el DNI de la persona.');
    }
    return value;
  }).messages({
    'number.base': 'El CUIT debe ser un número entero.',
    'number.empty': 'El CUIT es obligatorio.',
    'number.integer': 'El CUIT debe ser un número entero',
    'any.required': 'El CUIT es obligatorio.'
  }),
  celular: Joi.number().integer().required().messages({
    'number.base': 'El celular debe ser un número entero.',
    'number.integer': 'El celular debe ser un número entero.',
    'any.required': 'El celular es obligatorio.'
  }),
  celular_secundario: Joi.number().integer().optional().messages({
    'number.base': 'El celular secundario debe ser un número entero.',
    'number.integer': 'El celular secundario debe ser un número entero.'
  }),
  cuenta_banco: Joi.string().length(22).optional().messages({
      'string.length': 'La cuenta bancaria debe tener exactamente 22 caracteres.'
  }),
  condicion_iva: Joi.string().max(10).optional().messages({
    'string.base': 'La condición de IVA debe ser un texto.',
    'string.max': 'La condición de IVA debe tener como máximo 10 caracteres.'
  }),
  observacion: Joi.string().max(100).optional().messages({
    'string.base': 'La observación debe ser un texto.',
    'string.max': 'La observación debe tener como máximo 100 caracteres.'
  }),
  id_estado: Joi.number().integer().required().messages({
    'number.base': 'El ID de estado debe ser un número entero.',
    'number.integer': 'El ID de estado debe ser un número entero.',
    'any.required': 'El ID de estado es obligatorio.'
  }),
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
      'any.required': 'El email es obligatorio.',
      'string.email': 'El email debe tener un formato válido.',
    }),
  ocupacion: Joi.string().max(50).optional().messages({
    'string.base': 'La ocupacion debe ser un texto.',
    'string.max': 'La ocupacion debe tener como máximo 50 caracteres.'
  })
});


module.exports = {
  PersonaSchema,
  RegistrarPersonaSchema,
  PersonaEstadoSchema
};