const Joi = require('joi');

const RegistrarAlquilerSchema = Joi.object({
    numero_carpeta: Joi.number().integer().required().messages({
        'number.base': 'El numero de carpeta debe ser un número entero.',
        'number.integer': 'El numero de carpeta debe ser un número entero.',
        'any.required': 'El numero de carpeta es obligatorio.'
    }),
    id_inmueble: Joi.number().integer().required().messages({
        'number.base': 'El ID de inmueble debe ser un número entero.',
        'number.integer': 'El ID de inmueble debe ser un número entero.',
        'any.required': 'El ID de inmueble es obligatorio.'
    }),
    dni_inquilino: Joi.number().integer().required().messages({
        'number.base': 'El DNI de inquilino debe ser un número entero.',
        'number.integer': 'El DNI de inquilino debe ser un número entero.',
        'any.required': 'El DNI de inquilino es obligatorio.'
    }),
    fecha_inicio_contrato: Joi.date().iso().required().messages({
        'any.required': 'La fecha de inicio de contrato es obligatoria.',
        'date.iso': 'La fecha de inicio de contrato debe tener un formato válido.'
    }),
    fecha_fin_contrato: Joi.date().iso().required().messages({
        'any.required': 'La fecha de fin de contrato es obligatoria.',
        'date.iso': 'La fecha de fin de contrato debe tener un formato válido.'
    }),
    precio_inicial: Joi.number().greater(0).required().messages({
        'any.required': 'El precio inicial es obligatorio.',
        'number.greater': 'La precio inicial debe ser mayor a 0.',
        'number.base': 'La precio inicial debe ser un número.'
    }),
    id_moneda: Joi.number().integer().required().messages({
        'number.base': 'El ID de moneda debe ser un número entero.',
        'number.integer': 'El ID de moneda debe ser un número entero.',
        'any.required': 'El ID de moneda es obligatorio.'
    }),
    periodo_actualizacion: Joi.number().integer().required().messages({
        'number.base': 'El periodo de actualización debe ser un número entero.',
        'number.integer': 'El periodo de actualización debe ser un número entero.',
        'any.required': 'El periodo de actualización es obligatorio.'
    }),
    indice_actualizacion: Joi.string().max(50).required().messages({
        'string.base': 'El indice de actualización debe ser un texto.',
        'string.max': 'El indice de actualización debe tener como máximo 100 caracteres.',
        'any.required': 'El indice de actualización es obligatorio.'
    }),
    porcentaje_actualizacion: Joi.number().greater(0).optional().messages({
        'any.required': 'El precio inicial es obligatorio.',
        'number.greater': 'La precio inicial debe ser mayor a 0.',
        'number.base': 'La precio inicial debe ser un número.'
    }),
    id_forma_de_pago: Joi.number().integer().required().messages({
        'number.base': 'El ID de forma de pago debe ser un número entero.',
        'number.integer': 'El ID de forma de pago debe ser un número entero.',
        'any.required': 'El ID de forma de pago es obligatorio.'
    }),
    dia_vencimiento_inquilino: Joi.number().integer().greater(0).required().messages({
        'number.base': 'El dia de vencimiento del inquilino debe ser un número entero.',
        'number.greater': 'El dia de vencimiento del inquilino debe ser mayor a 0.',
        'number.integer': 'El dia de vencimiento del inquilino debe ser un número entero.',
        'any.required': 'El dia de vencimiento del inquilino es obligatorio.'
    }),
    dia_vencimiento_propietario: Joi.number().integer().greater(0).required().messages({
        'number.base': 'El dia de vencimiento del propietario debe ser un número entero.',
        'number.greater': 'El dia de vencimiento del propietario debe ser mayor a 0.',
        'number.integer': 'El dia de vencimiento del propietario debe ser un número entero.',
        'any.required': 'El dia de vencimiento del propietario es obligatorio.'
    }),
    porcentaje_mora_diaria: Joi.number().greater(0).required().messages({
        'any.required': 'El precio inicial es obligatorio.',
        'number.greater': 'La precio inicial debe ser mayor a 0.',
        'number.base': 'La precio inicial debe ser un número.'
    }),
    dia_inicial_mora: Joi.number().integer().required().messages({
        'number.base': 'El dia inicial de mora debe ser un número entero.',
        'number.integer': 'El dia inicial de mora debe ser un número entero.',
        'any.required': 'El dia inicial de mora es obligatorio.'
    }),
    observacion: Joi.string().max(100).optional().messages({
        'string.base': 'La observación debe ser un texto.',
        'string.max': 'La observación debe tener como máximo 100 caracteres.'
    }),
    fecha_registro: Joi.date().iso().required().messages({
        'any.required': 'La fecha de registro es obligatoria.',
        'date.iso': 'La fecha de registro debe tener un formato válido.'
    }),
    dni_propietario_principal: Joi.number().integer().required().messages({
        'number.base': 'El DNI de propietario principal debe ser un número entero.',
        'number.integer': 'El DNI de propietario principalpropietario principal debe ser un número entero.',
        'any.required': 'El DNI de propietario principal es obligatorio.'
    }),
    permite_venta: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo permite venta debe ser verdadero o falso.'
    }),

});

const updateAlquilerSchema = Joi.object({
    numero_carpeta: Joi.number().integer().required().messages({
        'number.base': 'El numero de carpeta debe ser un número entero.',
        'number.integer': 'El numero de carpeta debe ser un número entero.',
        'any.required': 'El numero de carpeta es obligatorio.'
    }),
    id_inmueble: Joi.number().integer().required().messages({
        'number.base': 'El ID de inmueble debe ser un número entero.',
        'number.integer': 'El ID de inmueble debe ser un número entero.',
        'any.required': 'El ID de inmueble es obligatorio.'
    }),
    dni_inquilino: Joi.number().integer().required().messages({
        'number.base': 'El DNI de inquilino debe ser un número entero.',
        'number.integer': 'El DNI de inquilino debe ser un número entero.',
        'any.required': 'El DNI de inquilino es obligatorio.'
    }),
    fecha_inicio_contrato: Joi.date().iso().required().messages({
        'any.required': 'La fecha de inicio de contrato es obligatoria.',
        'date.iso': 'La fecha de inicio de contrato debe tener un formato válido.'
    }),
    fecha_fin_contrato: Joi.date().iso().required().messages({
        'any.required': 'La fecha de fin de contrato es obligatoria.',
        'date.iso': 'La fecha de fin de contrato debe tener un formato válido.'
    }),
    precio_inicial: Joi.number().greater(0).required().messages({
        'any.required': 'El precio inicial es obligatorio.',
        'number.greater': 'La precio inicial debe ser mayor a 0.',
        'number.base': 'La precio inicial debe ser un número.'
    }),
    id_moneda: Joi.number().integer().required().messages({
        'number.base': 'El ID de moneda debe ser un número entero.',
        'number.integer': 'El ID de moneda debe ser un número entero.',
        'any.required': 'El ID de moneda es obligatorio.'
    }),
    periodo_actualizacion: Joi.number().integer().required().messages({
        'number.base': 'El periodo de actualización debe ser un número entero.',
        'number.integer': 'El periodo de actualización debe ser un número entero.',
        'any.required': 'El periodo de actualización es obligatorio.'
    }),
    indice_actualizacion: Joi.string().max(50).required().messages({
        'string.base': 'El indice de actualización debe ser un texto.',
        'string.max': 'El indice de actualización debe tener como máximo 100 caracteres.',
        'any.required': 'El indice de actualización es obligatorio.'
    }),
    porcentaje_actualizacion: Joi.number().greater(0).optional().messages({
        'any.required': 'El precio inicial es obligatorio.',
        'number.greater': 'La precio inicial debe ser mayor a 0.',
        'number.base': 'La precio inicial debe ser un número.'
    }),
    id_forma_de_pago: Joi.number().integer().required().messages({
        'number.base': 'El ID de forma de pago debe ser un número entero.',
        'number.integer': 'El ID de forma de pago debe ser un número entero.',
        'any.required': 'El ID de forma de pago es obligatorio.'
    }),
    dia_vencimiento_inquilino: Joi.number().integer().greater(0).required().messages({
        'number.base': 'El dia de vencimiento del inquilino debe ser un número entero.',
        'number.greater': 'El dia de vencimiento del inquilino debe ser mayor a 0.',
        'number.integer': 'El dia de vencimiento del inquilino debe ser un número entero.',
        'any.required': 'El dia de vencimiento del inquilino es obligatorio.'
    }),
    dia_vencimiento_propietario: Joi.number().integer().greater(0).required().messages({
        'number.base': 'El dia de vencimiento del propietario debe ser un número entero.',
        'number.greater': 'El dia de vencimiento del propietario debe ser mayor a 0.',
        'number.integer': 'El dia de vencimiento del propietario debe ser un número entero.',
        'any.required': 'El dia de vencimiento del propietario es obligatorio.'
    }),
    porcentaje_mora_diaria: Joi.number().greater(0).required().messages({
        'any.required': 'El precio inicial es obligatorio.',
        'number.greater': 'La precio inicial debe ser mayor a 0.',
        'number.base': 'La precio inicial debe ser un número.'
    }),
    dia_inicial_mora: Joi.number().integer().required().messages({
        'number.base': 'El dia inicial de mora debe ser un número entero.',
        'number.integer': 'El dia inicial de mora debe ser un número entero.',
        'any.required': 'El dia inicial de mora es obligatorio.'
    }),
    observacion: Joi.string().max(100).optional().messages({
        'string.base': 'La observación debe ser un texto.',
        'string.max': 'La observación debe tener como máximo 100 caracteres.'
    }),
    dni_propietario_principal: Joi.number().integer().required().messages({
        'number.base': 'El DNI de propietario principal debe ser un número entero.',
        'number.integer': 'El DNI de propietario principalpropietario principal debe ser un número entero.',
        'any.required': 'El DNI de propietario principal es obligatorio.'
    }),
    permite_venta: Joi.boolean().allow(null).messages({
        'boolean.base': 'El campo permite venta debe ser verdadero o falso.'
    })
});

module.exports = {
    RegistrarAlquilerSchema,
    updateAlquilerSchema
};