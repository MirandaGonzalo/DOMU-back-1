const Joi = require('joi');

const inmuebleSchema = Joi.object({
    codigo: Joi.number().integer().required().messages({
        'any.required': 'El código del inmueble es obligatorio.',
        'number.base': 'El código del inmueble debe ser un número entero.'
    }),
    id_direccion: Joi.number().integer().required().messages({
        'any.required': 'El ID de dirección es obligatorio.',
        'number.base': 'El ID de dirección debe ser un número entero.'
    }),
    id_estado: Joi.number().integer().required().messages({
        'any.required': 'El ID de estado es obligatorio.',
        'number.base': 'El ID de estado debe ser un número entero.'
    }),
    id_estado_anterior: Joi.number().integer().required().messages({
        'any.required': 'El ID del estado anterior es obligatorio.',
        'number.base': 'El ID del estado anterior debe ser un número entero.'
    }),
    fecha_ingreso: Joi.date().iso().required().messages({
        'any.required': 'La fecha de ingreso es obligatoria.',
        'date.iso': 'La fecha de ingreso debe tener un formato válido.'
    }),
    fecha_baja: Joi.date().iso().allow(null).messages({
        'date.iso': 'La fecha de baja debe tener un formato válido.'
    }),
    descripcion: Joi.string().max(100).allow(null).messages({
        'string.max': 'La descripción no debe exceder los 100 caracteres.'
    }),
    cantidad_baños: Joi.number().integer().allow(null).messages({
        'number.base': 'La cantidad de baños debe ser un número entero.'
    }),
    alarma: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo alarma debe ser verdadero o falso.'
    }),
    deposito: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo depósito debe ser verdadero o falso.'
    }),
    cloacas: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo cloacas debe ser verdadero o falso.'
    }),
    cocina: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo cocina debe ser verdadero o falso.'
    }),
    capacidad_estacionamiento: Joi.number().integer().allow(null).messages({
        'number.base': 'La capacidad de estacionamiento debe ser un número entero.'
    }),
    calefaccion: Joi.boolean().allow(null).messages({        
        'boolean.base': 'El campo calefacción debe ser verdadero o falso.'
    }),
    sistema_frio: Joi.boolean().allow(null).messages({        
        'boolean.base': 'El campo sistema frío debe ser verdadero o falso.'
    }),
    ambientes: Joi.number().greater(0).integer().required().messages({
        'any.required': 'El número de ambientes es obligatorio.',
        'number.greater': 'El número de ambientes debe ser mayor a 0.',
        'number.base': 'El número de ambientes debe ser un número entero.'
    }),
    total_superficie: Joi.number().greater(0).required().messages({
        'any.required': 'La superficie total es obligatoria.',
        'number.greater': 'La superficie debe ser mayor a 0.',
        'number.base': 'La superficie total debe ser un número.'
    }),
    frente_terreno: Joi.number().allow(null).messages({
        'number.base': 'El frente del terreno debe ser un número.'
    }),
    largo_terreno: Joi.number().allow(null).messages({
        'number.base': 'El largo del terreno debe ser un número.'
    }),
    superficie_edificada: Joi.number().allow(null).messages({
        'number.base': 'La superficie edificada debe ser un número.'
    }),
    superficie_descubierta: Joi.number().allow(null).messages({
        'number.base': 'La superficie descubierta debe ser un número.'
    }),
    plantas: Joi.number().integer().allow(null).messages({
        'number.base': 'El número de plantas debe ser un número entero.'
    }),
    expensas: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo expensas debe ser verdadero o falso.'
    }),
    nombre_complejo: Joi.string().max(50).allow(null).messages({
        'string.max': 'El nombre del complejo no debe exceder los {#limit} caracteres.'
    }),
    año_estreno: Joi.date().iso().allow(null).messages({
        'date.iso': 'El año de estreno debe tener un formato válido.'
    }),
    portero: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo portero debe ser verdadero o falso.'
    }),
    escritura: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo escritura debe ser verdadero o falso.'
    }),
    parrilla: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo parrilla debe ser verdadero o falso.'
    })
});

const inmuebleUpdateSchema = Joi.object({
    id_direccion: Joi.number().integer().required().messages({
        'any.required': 'El ID de dirección es obligatorio.',
        'number.base': 'El ID de dirección debe ser un número entero.'
    }),
    id_estado: Joi.number().integer().required().messages({
        'any.required': 'El ID de estado es obligatorio.',
        'number.base': 'El ID de estado debe ser un número entero.'
    }),
    id_estado_anterior: Joi.number().integer().required().messages({
        'any.required': 'El ID del estado anterior es obligatorio.',
        'number.base': 'El ID del estado anterior debe ser un número entero.'
    }),
    fecha_baja: Joi.date().iso().allow(null).messages({
        'date.iso': 'La fecha de baja debe tener un formato válido.'
    }),
    descripcion: Joi.string().max(100).allow(null).messages({
        'string.max': 'La descripción no debe exceder los 100 caracteres.'
    }),
    cantidad_baños: Joi.number().integer().allow(null).messages({
        'number.base': 'La cantidad de baños debe ser un número entero.'
    }),
    alarma: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo alarma debe ser verdadero o falso.'
    }),
    deposito: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo depósito debe ser verdadero o falso.'
    }),
    cloacas: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo cloacas debe ser verdadero o falso.'
    }),
    cocina: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo cocina debe ser verdadero o falso.'
    }),
    capacidad_estacionamiento: Joi.number().integer().allow(null).messages({
        'number.base': 'La capacidad de estacionamiento debe ser un número entero.'
    }),
    calefaccion: Joi.boolean().allow(null).messages({        
        'boolean.base': 'El campo calefacción debe ser verdadero o falso.'
    }),
    sistema_frio: Joi.boolean().allow(null).messages({        
        'boolean.base': 'El campo sistema frío debe ser verdadero o falso.'
    }),
    ambientes: Joi.number().greater(0).integer().required().messages({
        'any.required': 'El número de ambientes es obligatorio.',
        'number.greater': 'El número de ambientes debe ser mayor a 0.',
        'number.base': 'El número de ambientes debe ser un número entero.'
    }),
    total_superficie: Joi.number().greater(0).required().messages({
        'any.required': 'La superficie total es obligatoria.',
        'number.greater': 'La superficie debe ser mayor a 0.',
        'number.base': 'La superficie total debe ser un número.'
    }),
    frente_terreno: Joi.number().allow(null).messages({
        'number.base': 'El frente del terreno debe ser un número.'
    }),
    largo_terreno: Joi.number().allow(null).messages({
        'number.base': 'El largo del terreno debe ser un número.'
    }),
    superficie_edificada: Joi.number().allow(null).messages({
        'number.base': 'La superficie edificada debe ser un número.'
    }),
    superficie_descubierta: Joi.number().allow(null).messages({
        'number.base': 'La superficie descubierta debe ser un número.'
    }),
    plantas: Joi.number().integer().allow(null).messages({
        'number.base': 'El número de plantas debe ser un número entero.'
    }),
    expensas: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo expensas debe ser verdadero o falso.'
    }),
    nombre_complejo: Joi.string().max(50).allow(null).messages({
        'string.max': 'El nombre del complejo no debe exceder los {#limit} caracteres.'
    }),
    año_estreno: Joi.date().iso().allow(null).messages({
        'date.iso': 'El año de estreno debe tener un formato válido.'
    }),
    portero: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo portero debe ser verdadero o falso.'
    }),
    escritura: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo escritura debe ser verdadero o falso.'
    }),
    parrilla: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo parrilla debe ser verdadero o falso.'
    })
});

const InmuebleEstadoSchema = Joi.object({
    id: Joi.number().integer().required().messages({
      'number.base': 'El ID debe ser un número entero.',
      'number.integer': 'El ID debe ser un número entero.',
      'any.required': 'El ID es obligatorio.'
    }),
  });

module.exports = { 
    inmuebleSchema,
    inmuebleUpdateSchema,
    InmuebleEstadoSchema
};
