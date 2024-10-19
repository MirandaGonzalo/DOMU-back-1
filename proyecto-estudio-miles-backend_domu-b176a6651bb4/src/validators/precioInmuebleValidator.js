const Joi = require('joi');

const precioInmuebleSchema = Joi.object({
    id_inmueble: Joi.number().integer().required().messages({
        'number.base': 'La selección de Inmueble no es válida.',
        'any.required': 'La selección de Inmueble es obligatoria.'
    }),
    id_moneda: Joi.number().integer().required().messages({
        'number.base': 'La Moneda debe ser un número.',        
        'any.required': 'La Moneda es obligatorio.'
    }),
    tipo_precio: Joi.number().integer().required().messages({
        'number.base': 'El tipo de precio debe ser un número entero.',
        'any.required': 'El tipo de precio es obligatorio.'
    }),
    tipo: Joi.string().valid('Expensas', 'Alquiler', 'Venta').required().messages({
        'any.only': 'El tipo debe ser "Expensas", "Alquiler" o "Venta".',
        'any.required': 'El tipo es obligatorio.'
    }),
    monto: Joi.number().greater(0).required().messages({
        'number.base': 'El monto debe ser un número.',
        'number.greater': 'El monto debe ser mayor a 0.',
        'any.required': 'El monto es obligatorio.'
    }),
});


module.exports = {
    precioInmuebleSchema
}