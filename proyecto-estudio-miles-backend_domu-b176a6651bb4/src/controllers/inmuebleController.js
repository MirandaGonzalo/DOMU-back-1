const mariadb = require('mariadb')
const config = require("../../config/mariadb")
const gestor_direcciones = require('./direccionController')
const gestor_estados = require('./estadoController')
const { inmuebleSchema, inmuebleUpdateSchema, InmuebleEstadoSchema } = require('../validators/inmuebleValidator');
const { viviendaSchema } = require('../validators/viviendaValidator');
const { casaSchema } = require('../validators/casaValidator');
const { departamentoSchema } = require('../validators/departamentoValidator');
const { localComercialSchema } = require('../validators/localComercialValidator');
const { direccionSchema, direccionUpdateSchema } = require('../validators/direccionValidator');
const { precioInmuebleSchema } = require('../validators/precioInmuebleValidator');
const { detalleServicioSchema } = require('../validators/detalleServicioValidator');
const { personaInmuebleSchema } = require('../validators/inmuebleXPersonaValidator');
const { aptoInmuebleSchema } = require('../validators/inmuebleXAptoValidator');
const EstadoController = require('./estadoController');

const { Sequelize, FLOAT } = require('sequelize');
const { Op } = require("sequelize");
const sequelize = require('../../config/connection'); 
const { models } = require('../models/index');
const Inmueble = require('../models/inmueble');
const Estado = require('../models/estado');
const LocalComercial = require('../models/localComercial');
const Vivienda = require('../models/vivienda');
const Casa = require('../models/casa');
const Departamento = require('../models/departamento');
const PrecioInmueble = require('../models/precio_inmueble');
const DetalleServicio = require('../models/detalle_servicio');
const InmuebleXPersona = require('../models/inmueble_x_persona');
const InmuebleXApto = require('../models/inmueble_x_apto');
const Moneda = require('../models/moneda');
const { valid, exist } = require('joi');
const { convertirVaciosAUndefined, convertirUndefinedAVacios, verificarCambios, extraerDireccion } = require('../utilities/functions');
const Alquiler = require('../models/alquiler');

// Función para formatear el código
const formatearCodigoInmueble = (tipo, codigo) => {
    const bases = {
        "Local Comercial": 1000,
        "Casa": 2000,
        "Departamento": 3000
    };
    return (bases[tipo] || 0) + codigo;
};

// Funciones auxiliares
const obtenerTipoInmuebleRegistro = (tipo) => {
    const tipos = {
        "Casa" : 2,
        "Departamento" : 3,
        "Local Comercial" : 1
    };
    return tipos[tipo] || null;
};

const obtenerValorVacio = (campo) => {
    const camposTexto = ['descripcion', 'nombre_complejo'];
    const camposNumericos = ['cantidad_baños', 'capacidad_estacionamiento', 'plantas', 'frente_terreno', 'largo_terreno', 'superficie_edificada', 'superficie_descubierta', 'cantidad_dormitorios', 'cantidad_dormitorios_suites', 'cantidad_toilette'];

    if (camposTexto.includes(campo)) return '' 

    if (camposNumericos.includes(campo)) return 0 

    return false;
}

const definirCamposVacios = (data) => {
    Object.keys(data).forEach(key => {
        if (data[key] === undefined) {
            data[key] = obtenerValorVacio(key);
        }
    })
};

// Función para obtener el tipo de inmueble
const obtenerTipoInmueble = (inmueble) => {
    if (inmueble.local_comercial) {
        return 'Local Comercial';
    } else if (inmueble.vivienda) {
        if (inmueble.vivienda.casa) {
            return 'Casa';
        } else if (inmueble.vivienda.departamento) {
            return 'Departamento';
        }
    }
};

// Función para obtener el tipo de inmueble
const obtenerNombrePrecio = (tipo) => {
    if (tipo.tipo_precio == 0) {
        return 'Alquiler';
    } else if (tipo.tipo_precio == 1) {
        return 'Venta';
    } else if (tipo.tipo_precio == 2) {
        return 'Expensas';
    } else {
        return '';
    }
};

const mostrarPrecioXEstado = (estado, expensas) => {
    const precios = [];
    if (estado == 'Disponible Alquiler' || estado == 'Disponible Venta y Alquiler')
        precios.push(0);
    if (estado == 'Disponible Venta' || estado == 'Disponible Venta y Alquiler')
        precios.push(1);
    if (expensas)
        precios.push(2);
    return precios;
}

//Campos hechos en base al prototipo.
const getInmuebles = async (req, res) => {
    try {
        // Verifica el estado de la conexión antes de proceder
        await sequelize.authenticate();

        const inmuebles = await Inmueble.findAll({
            attributes: ['id', 'codigo', 'ambientes'],
            include: [
                {
                    model: models.Estado,
                    attributes: ['nombre'],
                    as: 'estado' // Este alias debe coincidir con la asociación definida
                },
                {
                    model: models.Persona,
                    attributes: ['dni', 'nombre'],
                    through: { attributes: [] } // Ocultar la tabla intermedia en el resultado
                  },
                {
                    model: models.Direccion,
                    attributes: ['id', 'localidad', 'barrio'],
                    as: 'direccion'
                },
                {
                    model: models.LocalComercial,
                    attributes: ['id_inmueble'],
                    as: 'local_comercial',
                    required: false // Incluye LocalComercial si existe
                },
                {
                    model: models.Vivienda,
                    attributes: ['id_inmueble'],
                    as: 'vivienda',
                    required: false, // Incluye Vivienda si existe
                    include: [
                        {
                            model: models.Casa,
                            attributes: ['id_vivienda'],
                            as: 'casa',
                            required: false // Incluye Casa si existe
                        },
                        {
                            model: models.Departamento,
                            attributes: ['id_vivienda'],
                            as: 'departamento',
                            required: false // Incluye Departamento si existe
                        }
                    ]
                }
            ]
        });

        // determinar el tipo de cada inmueble y agregar personNames
        const resultado = inmuebles.map(inmueble => {
            const plainInmueble = inmueble.toJSON();
            const personas = plainInmueble.Personas || [];
            const personNames = personas.map(persona => `${persona.nombre} - ${persona.dni}`).join(', ');

            // Llamar al método obtenerDireccionCompleta antes de convertir a objeto plano
            //const resumenDireccion = inmueble.direccion ? inmueble.direccion.obtenerDireccionCompleta() : null;

            return {
                ...plainInmueble,
                tipo: obtenerTipoInmueble(inmueble),  // Agregar el tipo de inmueble a la respuesta
                //resumenDireccion,
                personNames
            };

        });

        return res.json(resultado);

    } catch (error) {
        console.error('Error al obtener los inmuebles:', error);
        // Manejo del error y envío de una respuesta de error al cliente
        return res.status(500).json({ errors: 'Error al obtener los inmuebles.' });
    }
};

const obtenerInmueblesPorTipo = async (req, res) => {

    const { tipo } = req.params;
    let tipoInmueble = 'Casa';

    // Validar que el ID sea un número entero
    if (!Number.isInteger(Number(tipo))) {
      return res.status(400).json({ errors: 'El tipo debe ser un número entero válido.' });
    }

    try {
        // Verifica el estado de la conexión antes de proceder
        await sequelize.authenticate();
        let inmuebles = [];

        if (tipo == 1){
            // Busco Local Comercial
            inmuebles = await Inmueble.findAll({
                attributes: ['id', 'codigo', 'ambientes', 'total_superficie', 'cantidad_baños','expensas','cocina','deposito'],
                include: [
                    {
                        model: models.Estado,
                        attributes: ['nombre'],
                        as: 'estado' // Este alias debe coincidir con la asociación definida
                    },
                    {
                        model: models.Persona,
                        attributes: ['dni', 'nombre'],
                        through: { attributes: [] } // Ocultar la tabla intermedia en el resultado
                      },
                    {
                        model: models.Direccion,
                        attributes: ['id', 'localidad', 'barrio'],
                        as: 'direccion'
                    },
                    {
                        model: models.LocalComercial,
                        attributes: ['id_inmueble', 'vidriera'],
                        as: 'local_comercial',
                        required: true
                    }
                ]
            });
        }
        else if (tipo == 2){
            //Busco Casa
            inmuebles = await Inmueble.findAll({
                attributes: ['id', 'codigo','ambientes', 'capacidad_estacionamiento', 
                    'total_superficie', 'cantidad_baños','superficie_descubierta'],
                include: [
                    {
                        model: models.Estado,
                        attributes: ['nombre'],
                        as: 'estado' // Este alias debe coincidir con la asociación definida
                    },
                    {
                        model: models.Persona,
                        attributes: ['dni', 'nombre'],
                        through: { attributes: [] } // Ocultar la tabla intermedia en el resultado
                      },
                    {
                        model: models.Direccion,
                        attributes: ['id', 'localidad', 'barrio'],
                        as: 'direccion'
                    },
                    {
                        model: models.Vivienda,
                        attributes: ['id_inmueble','cantidad_dormitorios','pileta'],
                        as: 'vivienda',
                        required: true, // Incluye Vivienda si existe
                        include: [
                            {
                                model: models.Casa,
                                attributes: ['id_vivienda', 'reja'],
                                as: 'casa',
                                required: true // Incluye Casa si existe
                            }
                        ]
                    }
                ]
            });
        }
        else if (tipo == 3){
            //Busco Departamento
            inmuebles = await Inmueble.findAll({
                attributes: ['id', 'codigo', 'ambientes','expensas','total_superficie',
                    'cantidad_baños','capacidad_estacionamiento','portero'],
                include: [
                    {
                        model: models.Estado,
                        attributes: ['nombre'],
                        as: 'estado' // Este alias debe coincidir con la asociación definida
                    },
                    {
                        model: models.Persona,
                        attributes: ['dni', 'nombre'],
                        through: { attributes: [] } // Ocultar la tabla intermedia en el resultado
                      },
                    {
                        model: models.Direccion,
                        attributes: ['id', 'localidad', 'barrio','piso'],
                        as: 'direccion'
                    },
                    {
                        model: models.Vivienda,
                        attributes: ['id_inmueble','cantidad_dormitorios','balcon','mascotas'],
                        as: 'vivienda',
                        required: true, // Incluye Vivienda si existe
                        include: [
                            {
                                model: models.Departamento,
                                attributes: ['id_vivienda'],
                                as: 'departamento',
                                required: true // Incluye Departamento si existe
                            }
                        ]
                    }
                ]
            });
        }
        else{
            return res.status(400).json({ errors: 'El tipo de inmueble ingresado no es válido.' });
        }

        if (!inmuebles){
            return res.status(404).json({ errors: 'Inmueble Inexistente.' });
        }

        tipoInmueble = (tipo == 1 ? 'Local Comercial' : (tipo == 2 ? 'Casa' : 'Departamento'));

        let resultado = [];
        if (inmuebles.length > 0){        
            resultado = inmuebles.map(inmueble => {
                const plainInmueble = inmueble.toJSON();
                const personas = plainInmueble.Personas || [];
                const personNames = personas.map(persona => `${persona.nombre} - ${persona.dni}`).join(', ');

                return {
                    ...plainInmueble,
                    personNames,
                    tipo: tipoInmueble
                };
            });
        };

        return res.json(resultado);

    } catch (error) {
        console.error('Error al obtener el inmueble:', error);
        // Manejo del error y envío de una respuesta de error al cliente
        return res.status(500).json({ errors: 'Error al obtener los inmuebles.' });
    }
};

const obtenerEstado = async (estado) => {
    const estadosValidos = ["Disponible Alquiler", "Disponible Venta", "Disponible Venta y Alquiler", "Activo"];
    if (!estadosValidos.includes(estado)) return -1;
    const tipo = (estado == 'Activo' ? 'General' : 'Inmueble');
    return await gestor_estados.obtenerIdEstadoPorParametro(estado, tipo);
};

const obtenerEstadoModificar = async (estado) => {
    const estadosInvalidos = ["Inactivo", "Alquilado"];
    if (estadosInvalidos.includes(estado)) return -1;
    const tipo = ((estado == 'Activo' || estado == 'Alquilado' || estado == 'Vendido') ? 'General' : 'Inmueble');
    return await gestor_estados.obtenerIdEstadoPorParametro(estado, tipo);
};

const construirInmueble = (data, id_direccion, id_estado) => {
    const { descripcion, nombre_complejo, total_superficie, año_estreno, superficie_edificada, 
        superficie_descubierta, frente_terreno, largo_terreno, plantas, ambientes, capacidad_estacionamiento, 
        cantidad_baños, cocina, deposito, expensas, alarma, calefaccion, sistema_frio, portero, parrilla, 
        cloacas, escritura } = data;
    return {
        descripcion, nombre_complejo, total_superficie, año_estreno, superficie_edificada, 
        superficie_descubierta, frente_terreno, largo_terreno, plantas, ambientes, capacidad_estacionamiento, 
        cantidad_baños, cocina, deposito, expensas, alarma, calefaccion, sistema_frio, portero, parrilla, 
        cloacas, escritura, id_estado, id_estado_anterior: id_estado, id_direccion
    };
};

const obtenerPrecios = (data, id_inmueble) => {
    const precios = [];
    if (data.precio_alquiler) { 
        precios.push({ tipo_precio: 0, monto: data.precio_alquiler, id_moneda: data.moneda_alquiler, id_inmueble, tipo: 'Alquiler' });
    }
    if (data.precio_venta) {
        precios.push({ tipo_precio: 1, monto: data.precio_venta, id_moneda: data.moneda_venta, id_inmueble, tipo: 'Venta' } );
    }
    if (data.expensas) {
        precios.push({ tipo_precio: 2, monto: data.precio_expensas, id_moneda: data.moneda_expensas, id_inmueble, tipo: 'Expensas' });
    }
    return precios;
};

const obtenerServicios = (data, id_inmueble) => {
    const nuevos_servicios = [];
    data.forEach((servicio) => {
        nuevos_servicios.push({id_inmueble, id_servicio: servicio.id});
    });
    
    return nuevos_servicios;
};

const obtenerPropietarios = (data, id_inmueble) => {
    const nuevos_propietarios = [];
    data.forEach((propietario) => {
        nuevos_propietarios.push({id_inmueble, dni_persona: propietario.dni});
    });
    return nuevos_propietarios;
};

const obtenerAptos = (data, id_inmueble) => {
    const nuevos_aptos = [];
    data.forEach((apto) => {
        nuevos_aptos.push({id_inmueble, id_apto: apto.id});
    });
    return nuevos_aptos;
};

const construirVivienda = (data, id_inmueble) => {
    const { cantidad_dormitorios, cantidad_dormitorios_suites, cantidad_toilette, living, lavadero, vestidor, balcon, hall, pileta, mascotas } = data;
    return { id_inmueble, cantidad_dormitorios, cantidad_dormitorios_suites, cantidad_toilette, living, lavadero, vestidor, balcon, hall, pileta, mascotas };
};

const construirCasa = (data, id_vivienda) =>{
    const { patio, patio_interno, jardin, galeria, quincho, reja } = data;
    return { id_vivienda, patio, patio_interno, jardin, galeria, quincho, reja };
};

const construirDepartamento = (data, id_vivienda) =>{
    const { summ, ascensor, patio_en_comun, cantidad_pisos_edificio, gimnasio, solarium } = data;
    return { id_vivienda, summ, ascensor, patio_en_comun, cantidad_pisos_edificio, gimnasio, solarium };
};

const manejarTipoEspecifico = async (data, tipo, id_vivienda, transaction) => {
    if (tipo === 'Casa') {
        const casa = construirCasa(data, id_vivienda);
        const { casaError } = casaSchema.validate(casa, { abortEarly: false });
        if (casaError) {
            throw new Error(casaError.details.map(detail => detail.message));
        }
        await Casa.create(casa, { transaction });
    } else if (tipo === 'Departamento') {
        const departamento = construirDepartamento(data, id_vivienda);
        const { departamentoError } = departamentoSchema.validate(departamento, { abortEarly: false });
        if (departamentoError) {
            throw new Error(departamentoError.details.map(detail => detail.message));
        }
        await Departamento.create(departamento, { transaction });
    }
};

const construirLocalComercial = (data, id_inmueble) => {
    const { cortina_seguridad, vidriera, sala_de_estar } = data;
    return { id_inmueble, cortina_seguridad, vidriera, sala_de_estar };
};

const registrarInmueble = async (req, res) => {
    await sequelize.authenticate();
    const t = await sequelize.transaction();
    try {
        let { tipo } = req.body
        const tipoInmueble = obtenerTipoInmuebleRegistro(tipo);
        if (!tipoInmueble) {
            await t.rollback();
            return res.status(400).json({ errors: 'El tipo de Inmueble no es válido.' });
        }
        convertirVaciosAUndefined(req.body);
        const direccion = extraerDireccion(req.body);
        const { error: direccionError, value: direccionValue } = direccionSchema.validate(direccion, { abortEarly: false });
        if (direccionError) {
            await t.rollback();
            const errorsDireccion = direccionError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorsDireccion });
        }
        const id_direccion = await gestor_direcciones.agregar(direccion, t);
        // Obtener y validar estado
        const id_estado = await obtenerEstado(req.body.estado);
        if (id_estado === -1) {
            await t.rollback();
            return res.status(500).json({ errors: 'Error al asignar el estado del Inmueble.' });
        }
        const inmueble_nuevo = construirInmueble(req.body, id_direccion, id_estado);
        inmueble_nuevo.fecha_ingreso = new Date().toISOString().split('T')[0]
        const año_estreno = req.body.año_estreno;
        if (año_estreno) {
            try {
                // Intentar convertir la fecha a un objeto Date
                const date = new Date(año_estreno);
                // Verificar si la fecha es válida
                if (isNaN(date.getTime())) {
                    await t.rollback();
                    return res.status(400).json({ errors: 'Año Construcción no válida.' });                
                }
                // Formatear la fecha a formato ISO
                const isoDate = date.toISOString();
                inmueble_nuevo.año_estreno = isoDate;
              } catch (error) {
                    await t.rollback();
                    res.status(400).json({ errors: 'El campo "Año Construcción" debe ser una fecha válida en formato (dd/mm/YYYY).' });
            }
        }
        const ultimoInmueble = await Inmueble.findOne({
            attributes: ['id'],
            order: [['id', 'DESC']]
        });
        let codigo = 1;
        if (ultimoInmueble) {
            codigo = ultimoInmueble.id + 1;
        };
        inmueble_nuevo.codigo = formatearCodigoInmueble (tipo, codigo)
        const { error: inmuebleError, value: inmuebleValue } = await inmuebleSchema.validateAsync(inmueble_nuevo, { abortEarly: false });
        if (inmuebleError) {
            await t.rollback();
            const errorsInmueble = inmuebleError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorsInmueble });   
        }
        definirCamposVacios(inmueble_nuevo);
        inmueble_nuevo.año_estreno = (inmueble_nuevo.año_estreno == false ? null : inmueble_nuevo.año_estreno);
        const inmueble = await Inmueble.create(inmueble_nuevo, { transaction: t });
        if (!inmueble || !inmueble.id) {
            await t.rollback();
            return res.status(500).json({ errors: 'Error al registrar el Inmueble.' });
        }
        const valida_estado = req.body.estado;
        if (req.body.expensas){
            if (!req.body.precio_expensas){
                await t.rollback();
                return res.status(500).json({ errors: 'El precio de las expensas es obligatorio.' });
            }
        }
        if (valida_estado != 'Activo'){
            //Validar que los precios son existentes y coherentes con el tipo de Inmueble.
            if (valida_estado == 'Disponible Alquiler' || valida_estado == 'Disponible Venta y Alquiler'){
                if (!req.body.precio_alquiler){
                    await t.rollback();
                    return res.status(500).json({ errors: 'El precio de alquiler es obligatorio.' });
                }
            }
            
            if (valida_estado == 'Disponible Venta' || valida_estado == 'Disponible Venta y Alquiler'){
                if (!req.body.precio_venta){
                    await t.rollback();
                    return res.status(500).json({ errors: 'El precio de venta es obligatorio.' });
                }
            }
        }
        // Manejo de precios
        const precios = obtenerPrecios(req.body, inmueble.id);
        for (const precio of precios) {
            //Existe moneda
            const moneda = await Moneda.findByPk(precio.id_moneda);
            if (!moneda){
                await t.rollback();
                return res.status(400).json({ errors: `La moneda seleccionada para ${precio.tipo} no existe.` });
            };
            try{
                await precioInmuebleSchema.validateAsync(precio, { abortEarly: false });
                await PrecioInmueble.create(precio, { transaction: t });
            }
            catch (error){
                await t.rollback();
                const errorsPrecio = error.details.map(detail => `${precio.tipo}: ${detail.message}`);
                return res.status(400).json({ errors: errorsPrecio });
            }
        }
        const servicios = obtenerServicios(req.body.servicios, inmueble.id);
        convertirVaciosAUndefined(servicios);
        if (Object.keys(servicios).length <= 0) {
            await t.rollback();
            return res.status(500).json({ errors: 'Se debe asignar como mínimo 1 servicio.' });
        }
        const erroresServicios = [];
        for (const servicio of servicios) {
            try {
                const { error: servicioError } = await detalleServicioSchema.validateAsync(servicio, { abortEarly: false });
                if (servicioError) {
                    erroresServicios.push(...servicioError.details.map(detail => detail.message));
                } else {
                    await DetalleServicio.create(servicio, { transaction: t });
                }
            } catch (validationError) {
                erroresServicios.push(validationError.message);
            }
        }
        if (erroresServicios.length > 0) {
            await t.rollback();
            return res.status(400).json({ errors: erroresServicios });
        }
        const propietarios = obtenerPropietarios(req.body.propietarios, inmueble.id);
        if (propietarios.length <= 0) {
            await t.rollback();
            return res.status(500).json({ errors: 'Se debe asignar como mínimo 1 propietario.' });
        }
        convertirVaciosAUndefined(propietarios);
        const erroresPropietario = [];
        for (const propietario of propietarios) {
            try {
                const { error: propietarioError } = await personaInmuebleSchema.validateAsync(propietario, { abortEarly: false });
                if (propietarioError) {
                    erroresPropietario.push(...propietarioError.details.map(detail => detail.message));
                } else {
                    await InmuebleXPersona.create(propietario, { transaction: t });
                }
            } catch (validationError) {
                erroresPropietario.push(validationError.message);
            }
        }
        if (erroresPropietario.length > 0) {
            await t.rollback();
            return res.status(400).json({ errors: erroresPropietario });
        }
        const aptos = obtenerAptos(req.body.aptos, inmueble.id);
        convertirVaciosAUndefined(aptos);
        const erroresAptos = [];
        for (const apto of aptos) {
            try {
                const { error: aptoError } = await aptoInmuebleSchema.validateAsync(apto, { abortEarly: false });
                if (aptoError) {
                    erroresAptos.push(...aptoError.details.map(detail => detail.message));
                } else {
                    await InmuebleXApto.create(apto, { transaction: t });
                }
            } catch (validationError) {
                erroresAptos.push(validationError.message);
            }
        }
        if (erroresAptos.length > 0) {
            await t.rollback();
            return res.status(400).json({ errors: erroresAptos });
        }
        // Manejo de Vivienda y tipos específicos
        if (tipo === 'Casa' || tipo === 'Departamento') {
            const vivienda = construirVivienda(req.body, inmueble.id);
            const { viviendaError } = viviendaSchema.validate(vivienda, { abortEarly: false });
            if (viviendaError) {
                await t.rollback();
                const errorsVivienda = viviendaError.details.map(detail => detail.message);
                return res.status(400).json({ errors: errorsVivienda });
            }
            definirCamposVacios(vivienda);
            const viviendaNueva = await Vivienda.create(vivienda, { transaction: t });
            if (!viviendaNueva || !viviendaNueva.id_inmueble) {
                await t.rollback();
                return res.status(500).json({ errors: 'Error al registrar la Vivienda.' });
            }
            await manejarTipoEspecifico(req.body, tipo, viviendaNueva.id_inmueble, t);
        } else if (tipo === 'Local Comercial') {
            const local = construirLocalComercial(req.body, inmueble.id);
            const { localError } = localComercialSchema.validate(local, { abortEarly: false });
            if (localError) {
                await t.rollback();
                const errorsLocal = localError.details.map(detail => detail.message);
                return res.status(400).json({ errors: errorsLocal });
            }
            const localNuevo = await LocalComercial.create(local, { transaction: t });
            if (!localNuevo || !localNuevo.id_inmueble) {
                await t.rollback();
                return res.status(500).json({ errors: 'Error al registrar el Local Comercial.' });
            }
        }
        // Confirmar la transacción
        await t.commit();
        return res.status(201).json({ message: `Registro de ${tipo} exitoso.` });
    } catch (error) {
        if (error.isJoi) {
            await t.rollback();
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessages });
        }
        if (t)
        {
            await t.rollback();
        }        
        return res.status(500).json({ errors: 'Error al registrar el inmueble.' });
    }
};

const modificarInmueble = async (req, res) => {
    await sequelize.authenticate();
    const t = await sequelize.transaction();
    let hayCambios = false;
    try {
        let { tipo } = req.body
        const tipoInmueble = obtenerTipoInmuebleRegistro(tipo);
        if (!tipoInmueble) {
            await t.rollback();
            return res.status(400).json({ errors: 'El tipo de Inmueble no es válido.' });
        }
        convertirVaciosAUndefined(req.body);
        const direccionData = extraerDireccion(req.body);
        let direccionValue = null;
        const { error: direccionError, value: direccionValidated } = direccionUpdateSchema.validate(direccionData, { abortEarly: false });
        if (direccionError) {
            await t.rollback();
            const errorsDireccion = direccionError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorsDireccion });
        }
        direccionValue = direccionValidated;
        // Obtener el id_direccion desde los parámetros de la solicitud
        let id_direccion  = parseInt(req.body.id_direccion);
        if (!id_direccion) {
            await t.rollback();
            return res.status(404).json({ errors: 'Dirección no encontrada.' });
        }
        // Si hay cambios en la dirección, verificar si la dirección existe
        let direccionChanges = {};
        let direccion = {};
        if (direccionValue) {
            let id_dir  = parseInt(id_direccion);
            direccion = await models.Direccion.findByPk(id_dir);
            if (!direccion) {
                await t.rollback();
                return res.status(404).json({ errors: 'Dirección no encontrada.' });
            }
            convertirUndefinedAVacios(direccionValue);
            direccionChanges = verificarCambios(direccion, direccionValue);
        }
        // Revisar si se toca el estado o se deja el que estaba
        const id_estado = await obtenerEstadoModificar(req.body.estado);
        if (id_estado === -1) {
            await t.rollback();
            return res.status(500).json({ errors: 'Error al asignar el estado del Inmueble.' });
        }
        let id_estado_anterior  = parseInt(req.body.id_estado_anterior);
        if (!id_estado_anterior) {
            await t.rollback();
            return res.status(404).json({ errors: 'Estado no encontrado.' });
        }
        const estadoAnterior = await Estado.findOne({
            where: {
                id: id_estado_anterior
            }
        })
        if (!estadoAnterior){
            await t.rollback();
            return res.status(404).json({ errors: 'Estado inválido.' });
        }
        const inmueble_nuevo = construirInmueble(req.body, id_direccion, id_estado);
        if (id_estado != id_estado_anterior)
            inmueble_nuevo.id_estado_anterior = id_estado_anterior
        
        const año_estreno = req.body.año_estreno;
        if (año_estreno) {
            try {
                // Intentar convertir la fecha a un objeto Date
                const date = new Date(año_estreno);
                // Verificar si la fecha es válida
                if (isNaN(date.getTime())) {
                    await t.rollback();
                    return res.status(400).json({ errors: 'Año Construcción no válida.' });                
                }
                // Formatear la fecha a formato ISO
                const isoDate = date.toISOString();
            
                inmueble_nuevo.año_estreno = isoDate;
            } catch (error) {
                await t.rollback();
                res.status(400).json({ errors: 'El campo "Año Construcción" debe ser una fecha válida en formato (dd/mm/YYYY).' });
            }
        }
        convertirVaciosAUndefined(inmueble_nuevo);
        inmueble_nuevo.año_estreno = (inmueble_nuevo.año_estreno === undefined ? null : inmueble_nuevo.año_estreno);
        let inmuebleValue = null;
        const { error: inmuebleError, value: inmuebleValidated } = inmuebleUpdateSchema.validate(inmueble_nuevo, { abortEarly: false });
        if (inmuebleError) {
            await t.rollback();
            const errorsInmueble = inmuebleError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorsInmueble });
        }
        definirCamposVacios(inmueble_nuevo);
        inmuebleValue = inmueble_nuevo;
        //Valido que este campo no este vacío
        let id_inmueble  = parseInt(req.body.id);
        if (!id_inmueble) {
            await t.rollback();
            return res.status(404).json({ errors: 'Inmueble no encontrado.' });
        }
        // Si hay cambios en el inmueble, verificar si el inmueble existe
        let inmuebleChanges = {};
        let inmueble = {};
        if (inmuebleValue) {
            inmueble = await models.Inmueble.findByPk(id_inmueble);
            if (!inmueble) {
                await t.rollback();
                return res.status(404).json({ errors: 'Inmueble no encontrado.' });
            }
            // Convertir campos undefined a ''
            convertirUndefinedAVacios(inmuebleValue);
            if (inmueble.año_estreno)
                inmuebleValue.año_estreno = inmuebleValue.año_estreno.substring(0, inmuebleValue.año_estreno.indexOf("T"));
            // Verificar si hay cambios en los datos de dirección
            inmuebleChanges = verificarCambios(inmueble, inmuebleValue);
        }
        if (req.body.expensas){
            if (!req.body.precio_expensas){
                await t.rollback();
                return res.status(500).json({ errors: 'El precio de las expensas es obligatorio.' });
            }
        }
        //Validar que tenga valor
        const valida_estado = req.body.estado;
        if (valida_estado != 'Activo'){
            //Validar que los precios son existentes y coherentes con el tipo de Inmueble.
            if (valida_estado == 'Disponible Alquiler' || valida_estado == 'Disponible Venta y Alquiler'){
                if (!req.body.precio_alquiler){
                    await t.rollback();
                    return res.status(500).json({ errors: 'El precio de alquiler es obligatorio.' });
                }
            }
            
            if (valida_estado == 'Disponible Venta' || valida_estado == 'Disponible Venta y Alquiler'){
                if (!req.body.precio_venta){
                    await t.rollback();
                    return res.status(500).json({ errors: 'El precio de venta es obligatorio.' });
                }
            }
        }
        let erroresPrecios = [];
        let preciosViejos = [];
        let preciosNuevos = [];
        // Manejo de precios
        const precios = obtenerPrecios(req.body, id_inmueble);
        const precios_validos = mostrarPrecioXEstado(valida_estado, inmuebleValue.expensas);
        const precios_previos = await PrecioInmueble.findAll({
            where:{
                id_inmueble: id_inmueble
            }
        });
        precios_previos.forEach(precio => {
            preciosViejos.push({tipo: precio.tipo_precio,monto: precio.monto,moneda: precio.id_moneda});
        });
        if (precios_validos.length > 0){
            try
            {
                await PrecioInmueble.destroy({
                    where: {
                        id_inmueble: id_inmueble
                    }
                });
    
                for(const precio of precios){
                    if (precios_validos.includes(precio.tipo_precio)){
                        const moneda = await Moneda.findByPk(precio.id_moneda);                    
                        if (!moneda){
                            await t.rollback();
                            return res.status(500).json({ errors: `La moneda seleccionada para ${precio.tipo} no existe.` });
                        };
                        try{
                            const { error: precioError, value: precioValidated } = precioInmuebleSchema.validate(precio, { abortEarly: false });
                            if (precioError){
                                erroresPrecios.push(...precioError.details.map(detail => detail.message));
                            }
                            else
                            {
                                const nuevoPrecio = await models.PrecioInmueble.create(precioValidated, { transaction: t });
                                preciosNuevos.push({tipo: nuevoPrecio.tipo_precio,monto: nuevoPrecio.monto,moneda: nuevoPrecio.id_moneda});
                            }
                        }
                        catch (validationError) {
                            erroresPrecios.push(validationError.message);
                        }
                    }
                }
            }
            catch (validationError) {
                await t.rollback();
                return res.status(400).json({ errors: 'Error al registrar los precios.' });
            }
        }
        if (erroresPrecios.length > 0) {
            await t.rollback();
            return res.status(400).json({ errors: erroresPrecios });
        }
        if (JSON.stringify(preciosViejos) != JSON.stringify(preciosNuevos))
            hayCambios = true;

        const servicios = obtenerServicios(req.body.servicios, inmueble.id);
        convertirVaciosAUndefined(servicios);
        if (Object.keys(servicios).length <= 0) {
            await t.rollback();
            return res.status(500).json({ errors: 'Se debe asignar como mínimo 1 servicio.' });
        }
        const erroresServicios = [];
        const posee_servicios = await DetalleServicio.findAll({
            attributes: ['id_servicio'],
            where: {
                id_inmueble: id_inmueble
            }
        });
        let servicios_nuevos = [];
        let servicios_existentes = [];
        if (servicios.length > 0){
            servicios.forEach((servicio) => {
                servicios_nuevos.push(servicio.id_servicio);
           })
        }
        if (posee_servicios.length > 0){
           posee_servicios.forEach((servicio) => {
                servicios_existentes.push(servicio.id_servicio);
           })
        }
        let servicios_repetidos = [];
        let servicios_crear = [];
        for (var i = 0; i < servicios_nuevos.length; i++) {
            if (servicios_existentes.includes(servicios_nuevos[i]))
                servicios_repetidos.push(servicios_nuevos[i])
            else
                servicios_crear.push(servicios_nuevos[i])
        }
        if (!(JSON.stringify(servicios_nuevos) == JSON.stringify(servicios_existentes))){
            if (servicios_crear.length > 0){
                for (const servicio of servicios) {
                    const existeServicio = servicios_repetidos.includes(servicio.id_servicio);
                    const crearServicio = servicios_crear.includes(servicio.id_servicio);
                    if (!existeServicio && crearServicio){
                        try {
                            const { error: servicioError } = await detalleServicioSchema.validateAsync(servicio, { abortEarly: false });
                            if (servicioError) {
                                erroresServicios.push(...servicioError.details.map(detail => detail.message));
                            } else {
                                await DetalleServicio.create(servicio, { transaction: t });
                            }
                        } catch (validationError) {
                            erroresServicios.push(validationError.message);
                        }
                    }
                }
                if (erroresServicios.length > 0) {
                    await t.rollback();
                    return res.status(400).json({ errors: erroresServicios });
                }
            }
        }
        let servicios_eliminar = [];
        for (var i = 0; i < servicios_existentes.length; i++) {
            if (!servicios_repetidos.includes(servicios_existentes[i]) && !servicios_crear.includes(servicios_existentes[i]))
                servicios_eliminar.push(servicios_existentes[i])
        }
        if (servicios_eliminar.length > 0){
             //Elimino los servicios que no se asignaron
            try {
                await DetalleServicio.destroy({
                    where: {
                        id_inmueble: inmueble.id,
                        id_servicio: { [Op.in]: servicios_eliminar }
                    }
                });
        
            } 
            catch (validationError) {
                t.rollback()
                return res.status(400).json({ errors: validationError.message });
            }
        }
        if (servicios_eliminar.length > 0 || servicios_crear.length > 0)
            hayCambios = true;

        const propietarios = obtenerPropietarios(req.body.propietarios, inmueble.id);
        if (propietarios.length <= 0) {
            await t.rollback();
            return res.status(500).json({ errors: 'Se debe asignar como mínimo 1 propietario.' });
        }
        convertirVaciosAUndefined(propietarios);
        const erroresPropietario = [];
        const posee_propietarios = await InmuebleXPersona.findAll({
            attributes: ['dni_persona'],
            where: {
                id_inmueble: id_inmueble
            }
        });
        let propietarios_nuevos = [];
        let propietarios_existentes = [];
        if (propietarios.length > 0){
            propietarios.forEach((propietario) => {
                propietarios_nuevos.push(propietario.dni_persona);
           })
        }
        if (posee_propietarios.length > 0){
            posee_propietarios.forEach((propietario) => {
                propietarios_existentes.push(propietario.dni_persona);
           })
        }
        let propietarios_repetidos = [];
        let propietarios_crear = [];
        for (var i = 0; i < propietarios_nuevos.length; i++) {
            if (propietarios_existentes.includes(propietarios_nuevos[i]))
                propietarios_repetidos.push(propietarios_nuevos[i])
            else
                propietarios_crear.push(propietarios_nuevos[i])
        }

        if (!(JSON.stringify(propietarios_nuevos) == JSON.stringify(propietarios_existentes))){
            if (propietarios_crear.length > 0){
                for (const propietario of propietarios) {
                    const existePropietario = propietarios_repetidos.includes(propietario.dni_persona);
                    const crearPropietario = propietarios_crear.includes(propietario.dni_persona);
                    if (!existePropietario && crearPropietario){
                        try {
                            const { error: propietarioError } = await personaInmuebleSchema.validateAsync(propietario, { abortEarly: false });
                            if (propietarioError) {
                                erroresPropietario.push(...propietarioError.details.map(detail => detail.message));
                            } else {
                                await InmuebleXPersona.create(propietario, { transaction: t });
                            }
                        } catch (validationError) {
                            erroresPropietario.push(validationError.message);
                        }
                    }
                }
                if (erroresPropietario.length > 0) {
                    await t.rollback();
                    return res.status(400).json({ errors: erroresPropietario });
                }
            }
        }
        let propietarios_eliminar = [];
        for (var i = 0; i < propietarios_existentes.length; i++) {
            if (!propietarios_repetidos.includes(propietarios_existentes[i]) && !propietarios_crear.includes(propietarios_existentes[i]))
                propietarios_eliminar.push(propietarios_existentes[i])
        }
        if (propietarios_eliminar.length > 0){
             //Elimino los propietarios que no se asignaron
            propietarios_eliminar.forEach(prop => {
                try {
                    InmuebleXPersona.destroy({
                        where: {
                            id_inmueble: inmueble.id,
                            dni_persona: prop
                        }
                    });
                } 
                catch (validationError) {
                    t.rollback()
                    return res.status(400).json({ errors: validationError.message });
                }
            });
        }
        if (propietarios_eliminar.length > 0 || propietarios_crear.length > 0)
            hayCambios = true;

        const aptos = obtenerAptos(req.body.aptos, inmueble.id);
        convertirVaciosAUndefined(aptos);
        const erroresAptos = [];
        const posee_aptos = await InmuebleXApto.findAll({
            where: {
                id_inmueble: id_inmueble
            }
        });
        let aptos_nuevos = [];
        let aptos_existentes = [];
        if (aptos.length > 0){
            aptos.forEach((apto) => {
                aptos_nuevos.push(apto.id_apto);
           })
        }
        if (posee_aptos.length > 0){
            posee_aptos.forEach((apto) => {
                aptos_existentes.push(apto.id_apto);
           })
        }
        let aptos_repetidos = [];
        let aptos_crear = [];
        for (var i = 0; i < aptos_nuevos.length; i++) {
            if (aptos_existentes.includes(aptos_nuevos[i]))
                aptos_repetidos.push(aptos_nuevos[i])
            else
                aptos_crear.push(aptos_nuevos[i])
        }
        if (!(JSON.stringify(aptos_nuevos) == JSON.stringify(aptos_existentes))){
            if (aptos_crear.length > 0){
                for (const apto of aptos) {
                    const existeApto = aptos_repetidos.includes(apto.id_apto);
                    const crearApto = aptos_crear.includes(apto.id_apto);
                    if (!existeApto && crearApto){
                        const { error: aptoError } = await aptoInmuebleSchema.validateAsync(apto, { abortEarly: false });
                        if (aptoError) {
                            erroresAptos.push(...aptoError.details.map(detail => detail.message));
                        } else {
                            await InmuebleXApto.create(apto, { transaction: t });
                        }
                    }
                }
        
                if (erroresAptos.length > 0) {
                    await t.rollback();
                    return res.status(400).json({ errors: erroresAptos });
                }
            }
        }
        let aptos_eliminar = [];
        for (var i = 0; i < aptos_existentes.length; i++) {
            if (!aptos_repetidos.includes(aptos_existentes[i]) && !aptos_crear.includes(aptos_existentes[i]))
                aptos_eliminar.push(aptos_existentes[i])
        }
        if (aptos_eliminar.length > 0){
             //Elimino los propietarios que no se asignaron
            try {
                await InmuebleXApto.destroy({
                    where: {
                        id_inmueble: inmueble.id,
                        id_apto: { [Op.in]: aptos_eliminar }
                    }
                }, { transaction: t });
        
            } 
            catch (validationError) {
                t.rollback()
                return res.status(400).json({ errors: validationError.message });
            }
        }
        if (aptos_eliminar.length > 0 || aptos_crear.length > 0)
            hayCambios = true;

        let viviendaChanges = {};
        let viviendaVieja = null;
        let localChanges = {};
        let localViejo = null;
        let casaChanges = {};
        let casaVieja = null;
        let deptoChanges = {};
        let deptoViejo = null;
        // Manejo de Vivienda y tipos específicos
        if (tipo === 'Casa' || tipo === 'Departamento') {
            const vivienda = construirVivienda(req.body, id_inmueble);
            const { error: viviendaError, value: viviendaValues } = viviendaSchema.validate(vivienda, { abortEarly: false });
            if (viviendaError) {
                t.rollback();
                const errorsVivienda = viviendaError.details.map(detail => detail.message);
                return res.status(400).json({ errors: errorsVivienda });
            }
            definirCamposVacios(vivienda);
            if (viviendaValues) {
                viviendaVieja = await Vivienda.findByPk(id_inmueble);
                if (!viviendaVieja) {
                    await t.rollback();
                    return res.status(404).json({ errors: 'Vivienda no encontrada.' });
                }
                // Convertir campos undefined a ''
                convertirUndefinedAVacios(viviendaValues);
                // Verificar si hay cambios en los datos de dirección
                viviendaChanges = verificarCambios(viviendaVieja, viviendaValues);
            }
            if (tipo === 'Casa'){
                const casa = construirCasa(req.body, id_inmueble);
                const { error: casaError, value: casaValue } = casaSchema.validate(casa, { abortEarly: false });
                if (casaError) {
                    t.rollback();
                    const errorsCasa = casaError.details.map(detail => detail.message);
                    return res.status(400).json({ errors: errorsCasa });
                }
                //Veo si hay cambios
                definirCamposVacios(casa);
                if (casaValue) {
                    casaVieja = await Casa.findByPk(id_inmueble);

                    if (!casaVieja) {
                        await t.rollback();
                        return res.status(404).json({ errors: 'Casa no encontrada.' });
                    }
                    convertirUndefinedAVacios(casaValue);
                    // Verificar si hay cambios en los datos de la casa
                    casaChanges = verificarCambios(casaVieja, casaValue);
                }
            }
            else
            {
                const departamento = construirDepartamento(req.body, id_inmueble);
                const { error: departamentoError, value: departamentoValue } = departamentoSchema.validate(departamento, { abortEarly: false });
                if (departamentoError) {
                    t.rollback();
                    const departamentoErrors = departamentoError.details.map(detail => detail.message);
                    return res.status(400).json({ errors: departamentoErrors });
                }
                definirCamposVacios(departamento);
                if (departamentoValue) {
                    deptoViejo = await Departamento.findByPk(id_inmueble);
                    if (!deptoViejo) {
                        await t.rollback();
                        return res.status(404).json({ errors: 'Departamento no encontrado.' });
                    }
                    convertirUndefinedAVacios(departamentoValue);
                    // Verificar si hay cambios en los datos de departamento
                    deptoChanges = verificarCambios(deptoChanges, departamentoValue);
                }
            }
        } else if (tipo === 'Local Comercial') {
            const local = construirLocalComercial(req.body, id_inmueble);
            const { error: localError, value: localValue } = localComercialSchema.validate(local, { abortEarly: false });
            if (localError) {
                await t.rollback();
                const errorsLocal = localError.details.map(detail => detail.message);
                return res.status(400).json({ errors: errorsLocal });
            }
            definirCamposVacios(local);
            if (localValue) {
                localViejo = await LocalComercial.findByPk(id_inmueble);
                if (!localViejo) {
                    await t.rollback();
                    return res.status(404).json({ errors: 'Local Comercial no encontrado.' });
                }
                convertirUndefinedAVacios(localValue);
                // Verificar si hay cambios en los datos de dirección
                localChanges = verificarCambios(localViejo, localValue);
            }
        }
        try {
            // Actualizar la dirección si hay cambios
            if (Object.keys(direccionChanges).length > 0) {
                await direccion.update(direccionChanges, { transaction: t });
                hayCambios = true;
            }
            // Actualizar el inmueble si hay cambios
            if (Object.keys(inmuebleChanges).length > 0) {
                await inmueble.update(inmuebleChanges, { transaction: t });
                hayCambios = true;
            }
            // Actualizar la vivienda si hay cambios
            if (Object.keys(viviendaChanges).length > 0) {
                await viviendaVieja.update(viviendaChanges, { transaction: t });
                hayCambios = true;
            }
            //Actualizar la casa si hay cambios
            if (Object.keys(casaChanges).length > 0){
                await casaVieja.update(casaChanges);
                hayCambios = true;
            }
            //Actualizar el departamento si hay cambios
            if (Object.keys(deptoChanges).length > 0){
                await deptoViejo.update(deptoChanges);
                hayCambios = true;
            }
            // Actualizar el local comercial si hay cambios
            if (Object.keys(localChanges).length > 0) {
                await localViejo.update(localChanges, { transaction: t });
                hayCambios = true;
            }
        }
        catch (validationError) {
            t.rollback()
            return res.status(400).json({ errors: validationError.message });
        }
        // Confirmar la transacción
        const msgRes = (hayCambios ? `Modificación de ${tipo} exitoso.` : 'No hay cambios para actualizar.');
        await t.commit();
        const statusService = (hayCambios ? 201 : 200);
        return res.status(statusService).json({ message: msgRes});
    } 
    catch (error) {
        if (error.isJoi) {
            await t.rollback();
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessages });
        }
        if (t)
        {
            await t.rollback();
        }        
        return res.status(500).json({ errors: 'Error al modificar el inmueble.' });
    }
};

const obtenerDetalleInmueble = async (req, res) => {

    const { id } = req.params;
  
    // Validar que el ID sea un número entero
    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({ errors: 'El ID debe ser un número entero válido.' });
    }

    try {
        // Verifica el estado de la conexión antes de proceder
        await sequelize.authenticate();

        const inmueble = await Inmueble.findByPk(id,{
            include: [{
                model: models.Estado,
                as: 'estado' // Este alias debe coincidir con la asociación definida
            },
            {
                model: models.Persona,
                through: { attributes: [] } // Ocultar la tabla intermedia en el resultado
            },
            {
                model: models.Direccion,
                as: 'direccion'
            },
            {
                model: models.AptoPara,
                through: { attributes: [] }
            },
            {
                model: models.Servicio,
                through: { attributes: [] }
            },
            {
                model: models.LocalComercial,
                as: 'local_comercial',
                required: false // Incluye LocalComercial si existe
            },
            {
                model: models.Vivienda,
                as: 'vivienda',
                required: false, // Incluye Vivienda si existe
                include: [
                    {
                        model: models.Casa,
                        as: 'casa',
                        required: false // Incluye Casa si existe
                    },
                    {
                        model: models.Departamento,
                        as: 'departamento',
                        required: false // Incluye Departamento si existe
                    }
                ]
            }
        ]
        });

        // Si el inmueble no existe, devolver un error 404
        if (!inmueble) {
            return res.status(404).json({ errors: 'Inmueble no encontrado.' });
        };

        const precios_validos = mostrarPrecioXEstado(inmueble.estado.nombre, inmueble.expensas);

        // Paso 2: Obtener los precios del inmueble
        const precios = await PrecioInmueble.findAll({
            where: {
                id_inmueble: id,
                tipo_precio: { [Op.in]: precios_validos },
            },
            include: [
                {
                    model: Moneda,
                    as: 'moneda' // Alias definido en la asociación
                }
            ]
        });

        inmueble.dataValues.PrecioInmuebles = precios.map(precio => precio.toJSON());

        const aux = inmueble.PrecioInmuebles;
        // Procesar el tipo de cada precio
        inmueble.dataValues.PrecioInmuebles.forEach((precio) => {
            precio.tipo_precio = obtenerNombrePrecio(precio);
        });

        // agrego el tipo
        const resultado = {
            ...inmueble.toJSON(),
            tipo: obtenerTipoInmueble(inmueble),
        };

        return res.json(resultado);
    } catch (error) {
        console.error('Error al obtener el inmueble:', error);
        // Manejo del error y envío de una respuesta de error al cliente
        return res.status(500).json({ errors: 'Error al obtener los inmuebles.' });
    }
};

const modificarEstadoInmueble = async (req, res) => {

    await sequelize.authenticate();
    const t = await sequelize.transaction();

    // se obtiene id de body
    let id  = parseInt(req.body.id);

    // se juntan datos de persona
    const inmuebleData = { id };

    // Validar los datos recibidos usando Joi
    const { error: inmuebleError, value: inmuebleValue } = InmuebleEstadoSchema.validate(inmuebleData, { abortEarly: false });

    if (inmuebleError) {
        await t.rollback();
        const errorMessages = inmuebleError.details.map(detail => detail.message);
        return res.status(400).json({ errors: errorMessages });
    }

    try{
        // Buscar inmueble por Id con su estado actual y el anterior
        const inmueble = await Inmueble.findByPk(id, {
            include: [
                {
                    model: Estado,
                    as: 'estado' 
                }
            ]
        });

        // Si el inmueble no existe, devolver 404
        if (!inmueble) {
            await t.rollback();
            return res.status(404).json({ error: 'Inmueble no encontrado.' });
        }

        let nombreEstadoInmuebleActual = inmueble.estado.nombre;
        let tipoEstadoInmuebleActual = inmueble.estado.tipo;

        let nuevoValor = -1
        let fecha_baja = null

        if((nombreEstadoInmuebleActual == "Activo" && tipoEstadoInmuebleActual == "General") || 
            (nombreEstadoInmuebleActual == "Disponible Alquiler" || nombreEstadoInmuebleActual == "Disponible Venta" 
            || nombreEstadoInmuebleActual == "Disponible Venta y Alquiler" && tipoEstadoInmuebleActual == "Inmueble")){

            nuevoValor = await gestor_estados.obtenerIdEstadoInactivoGeneral();
            fecha_baja = new Date().toISOString().split('T')[0];
        }
        else if(nombreEstadoInmuebleActual == "Inactivo" && tipoEstadoInmuebleActual == "General"){

            nuevoValor = inmueble.id_estado_anterior;
        }
        else{
            await t.rollback();
            return res.status(404).json({ error: 'Inmueble con estado erróneo.' });
        }

        if (nuevoValor == -1 || isNaN(nuevoValor)){
            await t.rollback(); // Deshacer la transacción en caso de error
            return res.status(500).json({ error: 'Error al modificar el inmueble.' });
        }

        const nuevoEstado = await Estado.findByPk(nuevoValor);

        // Actualizar el inmueble
        await Inmueble.update({ id_estado: nuevoValor, id_estado_anterior: inmueble.id_estado, fecha_baja: fecha_baja }, {
            where: { id: id },
            transaction: t
          });
      
          // Confirmar la transacción
          await t.commit();
    
          res.status(200).json({ message: `Estado de inmueble ${inmueble.codigo} actualizado a: ${nuevoEstado.nombre}` });
      
    } 
    catch (error) {
        await t.rollback(); // Deshacer la transacción en caso de error
        return res.status(500).json({ error: 'Error al desactivar el inmueble.'});
    }
}

const getInmueblesDisponibleAlquiler = async (req, res) => {
    try {
        // Verifica el estado de la conexión antes de proceder
        await sequelize.authenticate();
  
        const inmuebles = await Inmueble.findAll(
        {
            attributes: ['id', 'codigo'],
            include: [
                {
                    model: Estado,
                    as: 'estado', 
                    where: { 
                        [Op.or]: [
                            { nombre: 'Disponible Alquiler' },
                            { nombre: 'Disponible Venta y Alquiler' }  // Reemplaza 'Otro Estado' con el nombre del estado adicional que desees buscar
                        ]
                     },
                    attributes: []
                },
                {
                    model: models.Persona,
                    attributes: ['dni', 'nombre'],
                    through: { attributes: [] } 
                },
                {
                    model: models.Direccion,
                    attributes: ['localidad', 'barrio'],
                    as: 'direccion'
                },
                {
                    model: models.LocalComercial,
                    attributes: ['id_inmueble'],
                    as: 'local_comercial',
                    required: false // Incluye LocalComercial si existe
                },
                {
                    model: models.Vivienda,
                    attributes: ['id_inmueble'],
                    as: 'vivienda',
                    required: false, // Incluye Vivienda si existe
                    include: [
                        {
                            model: models.Casa,
                            attributes: ['id_vivienda'],
                            as: 'casa',
                            required: false // Incluye Casa si existe
                        },
                        {
                            model: models.Departamento,
                            attributes: ['id_vivienda'],
                            as: 'departamento',
                            required: false // Incluye Departamento si existe
                        }
                    ]
                },
                {
                    model: models.Servicio,
                    through: { attributes: [] }
                },
            ]
        });

        const resultado = inmuebles.map(inmueble => {
            const plainInmueble = inmueble.toJSON();
            const personas = plainInmueble.Personas || [];
            const propietarios = personas.map(persona => `${persona.nombre} - ${persona.dni}`).join(', ');
            plainInmueble.Personas.forEach(persona => {
                persona.nombre_dni = `${persona.nombre} - ${persona.dni}`;
            })

            delete plainInmueble.local_comercial;
            delete plainInmueble.vivienda;
            delete plainInmueble.casa;
            delete plainInmueble.departamento;

            return {
                ...plainInmueble,
                tipo: obtenerTipoInmueble(inmueble), 
                propietarios
            };

        });
  
        return res.json(resultado);
        
    } catch (error) {
        console.error('Error al obtener los inmuebles:', error);
        // Manejo del error y envío de una respuesta de error al cliente
        return res.status(500).json({ errors: 'Error al obtener los inmuebles.' });
    }
}

const validarInmueble = async (id, estadosValidos) => {
    try {
        // Validar que el ID sea un número entero
        if (!Number.isInteger(Number(id))) {
            return { valid: false, message: 'El id de Inmueble debe ser un número entero.' };
        }
        const inmuebleSel = await Inmueble.findByPk(id);
        if (!inmuebleSel) {
            return { valid: false, message: 'El Inmueble seleccionado no existe.' };
        }
        const validacionEstadosInmueble = await EstadoController.validarEstado(inmuebleSel.id_estado, estadosValidos);
        if (!validacionEstadosInmueble.valid){
            return { valid: false, message: 'El Inmueble seleccionado no está en el estado correcto.' };
        }

        return { valid: true };
    } catch (err) {
        return { valid: false, message: 'Error al validar el Inmueble' };
    }
};

const filtrarAlquiladosNoDispVenta = (inmueble) => {
    if(inmueble.estado.nombre === 'Alquilado'){
        if(inmueble.Alquilers[0].permite_venta === true){
            return true;
        }
        else{
            return false
        }
    }
    else{
        return true;
    }
}

const getInmueblesDisponibleVenta = async (req, res) => {
    try {
        // Verifica el estado de la conexión antes de proceder
        await sequelize.authenticate();
  
        const inmuebles = await Inmueble.findAll(
        {
            attributes: ['id', 'codigo'],
            include: [
                {
                    model: Estado,
                    as: 'estado', 
                    where: { 
                        [Op.or]: [
                            { nombre: 'Disponible Venta' },
                            { nombre: 'Disponible Venta y Alquiler' },
                            { nombre: 'Alquilado' } 
                        ]
                    },
                    attributes: ['nombre']
                },
                {
                    model: models.Persona,
                    attributes: ['dni', 'nombre'],
                    through: { attributes: [] } 
                },
                {
                    model: models.Direccion,
                    attributes: ['calle', 'numero', 'localidad', 'barrio'],
                    as: 'direccion'
                },
                {
                    model: models.LocalComercial,
                    attributes: ['id_inmueble'],
                    as: 'local_comercial',
                    required: false // Incluye LocalComercial si existe
                },
                {
                    model: models.Vivienda,
                    attributes: ['id_inmueble'],
                    as: 'vivienda',
                    required: false, // Incluye Vivienda si existe
                    include: [
                        {
                            model: models.Casa,
                            attributes: ['id_vivienda'],
                            as: 'casa',
                            required: false // Incluye Casa si existe
                        },
                        {
                            model: models.Departamento,
                            attributes: ['id_vivienda'],
                            as: 'departamento',
                            required: false // Incluye Departamento si existe
                        }
                    ]
                },
                {
                    model: models.Alquiler,
                    attributes: ['permite_venta'],
                    include:
                    {
                        model: models.Estado,
                        as: 'estado', 
                        where: { 
                            [Op.or]: [
                                { nombre: 'Vigente' },
                                { nombre: 'Por Iniciar' }
                            ]
                        },
                        attributes: ['nombre']
                    },
                    required: false
                }
            ]
        });

        const inmueblesFiltrados = inmuebles.filter(inmueble => filtrarAlquiladosNoDispVenta(inmueble));

        const resultado = inmueblesFiltrados.map(inmueble => {
            const plainInmueble = inmueble.toJSON();
            const personas = plainInmueble.Personas || [];
            const propietarios = personas.map(persona => `${persona.nombre} - ${persona.dni}`).join(', ');
            const direccion = `${inmueble.direccion.calle} ${inmueble.direccion.numero}, ${inmueble.direccion.localidad}, ${inmueble.direccion.barrio}`;

            delete plainInmueble.Personas;
            delete plainInmueble.local_comercial;
            delete plainInmueble.vivienda;
            delete plainInmueble.casa;
            delete plainInmueble.departamento;
            delete plainInmueble.direccion;

            return {
                ...plainInmueble,
                tipo: obtenerTipoInmueble(inmueble), 
                propietarios,
                direccion
            };

        });
  
        return res.json(resultado);
        
    } catch (error) {
        console.error('Error al obtener los inmuebles:', error);
        // Manejo del error y envío de una respuesta de error al cliente
        return res.status(500).json({ errors: 'Error al obtener los inmuebles.' });
    }
}


module.exports = {
    getInmuebles,
    obtenerDetalleInmueble,
    obtenerInmueblesPorTipo,
    registrarInmueble,
    modificarInmueble,
    modificarEstadoInmueble,
    getInmueblesDisponibleAlquiler,
    validarInmueble,
    obtenerTipoInmueble,
    getInmueblesDisponibleVenta,
    filtrarAlquiladosNoDispVenta
};