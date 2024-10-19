const sequelize = require('../../config/connection'); 
const Venta = require("../models/venta");
const { models } = require('../models/index');
const { obtenerTipoInmueble, concatenarMontoYMoneda, convertirVaciosAUndefined, convertirFechaAIso, verificarCambios, convertirUndefinedAVacios } = require('../utilities/functions');
const { RegistrarVentaSchema, ModificarVentaSchema } = require('../validators/ventaValidator');
const InmuebleController = require('../controllers/inmuebleController');
const PersonaController = require('../controllers/personaController');
const MonedaController = require('../controllers/monedaController');
const FormaPagoController = require('../controllers/formaPagoController');
const EstadoController = require('../controllers/estadoController');
const AlquilerController = require('../controllers/alquilerController');
const { Op } = require('sequelize');
const Inmueble = require('../models/inmueble');

const construirVenta = (data) => {
    const { fecha_venta, id_inmueble, dni_comprador, precio_venta, id_forma_de_pago, id_moneda, porcentaje_comision, observacion, monto_reserva } = data;
    return { fecha_venta, id_inmueble, dni_comprador, precio_venta, id_forma_de_pago, id_moneda, porcentaje_comision, observacion, monto_reserva }
}

const construirVentaModificar = (data) => {
    const { fecha_venta, monto_reserva, precio_venta, id_forma_de_pago, id_moneda, porcentaje_comision, observacion } = data;
    return { fecha_venta, monto_reserva, precio_venta, id_forma_de_pago, id_moneda, porcentaje_comision, observacion }
}

const getVentas = async (req, res) => {
    try {
        await sequelize.authenticate();

        const ventas = await Venta.findAll({
            attributes:['id', 'porcentaje_comision', 'fecha_venta', 'precio_venta', 'monto_reserva'],
            include: [
                {
                    model: models.Inmueble,
                    attributes: ['id'],
                    as: 'inmueble',
                    include:[
                        {
                            model: models.Persona,
                            attributes: ['dni', 'nombre'],
                            through: { attributes: [] },
                            as: 'Personas'
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
                            required: false
                        },
                        {
                            model: models.Vivienda,
                            attributes: ['id_inmueble'],
                            as: 'vivienda',
                            required: false,
                            include: [
                                {
                                    model: models.Casa,
                                    attributes: ['id_vivienda'],
                                    as: 'casa',
                                    required: false
                                },
                                {
                                    model: models.Departamento,
                                    attributes: ['id_vivienda'],
                                    as: 'departamento',
                                    required: false 
                                }
                            ]
                        }
                    ]
                },
                {
                    model: models.Persona,
                    attributes: ['dni', 'nombre'],
                    as: 'comprador'
                },
                {
                    model: models.Persona,
                    attributes: ['dni', 'nombre'],
                    through: { attributes: ['es_comprador'] },
                    as: 'personas'
                },
                {
                    model: models.Moneda,
                    attributes: ['descripcion', 'nombre'],
                    as: 'moneda'
                },
                {
                    model: models.Estado,
                    attributes: ['nombre'],
                    as: 'estado'
                },
            ]
        });

        // determinar el tipo del inmueble de cada alquiler y agregar nombresPropietarios 
        const resultado = await Promise.all(ventas.map(async (venta) => {
            const JSONVenta = venta.toJSON();

            
            JSONVenta.comprador.nombre_dni = `${JSONVenta.comprador.nombre} - ${JSONVenta.comprador.dni}`;

            
            JSONVenta.inmueble.tipo = obtenerTipoInmueble(JSONVenta.inmueble);

            JSONVenta.inmueble.direccion = `${JSONVenta.inmueble.direccion.barrio} - ${JSONVenta.inmueble.direccion.localidad}`;

            const comision = JSONVenta.precio_venta * JSONVenta.porcentaje_comision / 100;
            JSONVenta.monto_reserva = concatenarMontoYMoneda(JSONVenta.monto_reserva, JSONVenta.moneda);
            JSONVenta.precio_venta = concatenarMontoYMoneda(JSONVenta.precio_venta, JSONVenta.moneda);
            JSONVenta.monto_comision = `${JSONVenta.moneda.descripcion} (${JSONVenta.moneda.nombre}) ${comision} (${JSONVenta.porcentaje_comision}%)`;

            if(venta.estado.nombre === 'Reservada' || venta.estado.nombre === 'Cancelada' ){
                const propietarios = JSONVenta.inmueble.Personas;
                const nombresPropietarios = propietarios.map(persona => `${persona.nombre} - ${persona.dni}`).join(', ');
                JSONVenta.inmueble.nombresPropietarios = nombresPropietarios;
            }
            else if(venta.estado.nombre === 'Cerrada'){
                const propietarios = JSONVenta.personas.filter(propietario => propietario.venta_x_persona.es_comprador == false) || [];
                const nombresPropietarios = propietarios.map(persona => `${persona.nombre} - ${persona.dni}`).join(', ');
                JSONVenta.inmueble.nombresPropietarios = nombresPropietarios;
            }
            else{
                JSONVenta.inmueble.nombresPropietarios = '';
            }

            //delete JSONVenta.inmueble.Personas;
            return {
                ...JSONVenta
            };
        
        }));

        return res.json(resultado);

    } catch (error) {
        console.error('Error al obtener las ventas:', error);
        return res.status(500).json({ errors: 'Error al obtener las ventas.' });
    }
};

const registrarReserva = async (req, res) => {
    await sequelize.authenticate();
    const t = await sequelize.transaction();

    try{
        // Convertir campos vacíos a undefined
        convertirVaciosAUndefined(req.body);

        // Extraer datos de alquiler del cuerpo de la solicitud y juntarlos
        const venta_nueva = construirVenta(req.body);

        //convertir fecha inicio contrato a Date
        const fecha_venta = venta_nueva.fecha_venta;
        if (fecha_venta) {
            const isoDate = await convertirFechaAIso(fecha_venta, t, res, 'Fecha de Venta no válida.');
            if (isoDate) venta_nueva.fecha_venta = isoDate;
        }

        // Validar los datos recibidos usando Joi
        const { error: ventaError } = RegistrarVentaSchema.validate(venta_nueva, { abortEarly: false });

        if (ventaError) {
            await t.rollback();
            const errorMessage = ventaError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessage });
        }

        if(Number(venta_nueva.monto_reserva) >= Number(venta_nueva.precio_venta)){
            await t.rollback();
            return res.status(400).json({ errors: 'La reserva no puede ser mayor al precio de venta!'});
        }

        //validar inmueble y su estado actual
        const validacionInmueble = await InmuebleController.validarInmueble(venta_nueva.id_inmueble, ['Disponible Venta', 'Disponible Venta y Alquiler', 'Alquilado']);
        if (!validacionInmueble.valid) {
            await t.rollback();
            return res.status(400).json({ errors: validacionInmueble.message });
        }
        const inmueble = await models.Inmueble.findByPk(venta_nueva.id_inmueble, {
            attributes: ['id', 'id_estado'],
            include: [
                {
                    model: models.Estado,
                    attributes: ['nombre'],
                    as: 'estado'
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
        })
        if(!InmuebleController.filtrarAlquiladosNoDispVenta(inmueble)){
            await t.rollback();
            return res.status(400).json({ errors: 'El inmueble se encuentra alquilado y no permite venta!' });
        }

        //validar comprador
        const validacionComprador = await PersonaController.validarPersona(venta_nueva.dni_comprador);
        if (!validacionComprador.valid) {
            await t.rollback();
            return res.status(400).json({ errors: validacionInquilino.message.concat(' (Comprador)') });
        }

        //validar moneda
        const validacionMoneda = await MonedaController.validarMoneda(venta_nueva.id_moneda);
        if (!validacionMoneda.valid) {
            await t.rollback();
            return res.status(400).json({ errors: validacionMoneda.message });
        }

        //validar forma de pago
        const validacionFormaPago = await FormaPagoController.validarFormaPago(venta_nueva.id_forma_de_pago);
        if (!validacionFormaPago.valid) {
            await t.rollback();
            return res.status(400).json({ errors: validacionFormaPago.message });
        }

        //asignar estado
        const id_estado_reservada = await EstadoController.obtenerIdEstadoPorParametro('Reservada', 'Venta')
        venta_nueva.id_estado = id_estado_reservada;

        //actualizar el estado de inmueble
        if(inmueble.estado.nombre === 'Disponible Venta' || inmueble.estado.nombre === 'Disponible Venta y Alquiler'){
            const estadoReservado = await EstadoController.obtenerIdEstadoPorParametro("Reservado", "Inmueble");
            updateInmueble = {
                id_estado: estadoReservado,
                id_estado_anterior: inmueble.id_estado
            };           
        }
        else if(inmueble.estado.nombre === 'Alquilado'){
            const estadoAlquiladoReservado = await EstadoController.obtenerIdEstadoPorParametro("Alquilado Reservado", "Inmueble");
            updateInmueble = {
                id_estado: estadoAlquiladoReservado,
                id_estado_anterior: inmueble.id_estado
            };       
        }

        await Venta.create(venta_nueva, { transaction: t });
        await inmueble.update(updateInmueble, { transaction: t });

        await t.commit();
        return res.status(201).json({ message: 'Registro de reserva de venta exitoso.' });
    }
    catch(error){
        if (error.isJoi) {
            await t.rollback();
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessages });
        }
        if (!t.finished)
        {
            await t.rollback();
        }
        if (!res.headersSent){
            return res.status(500).json({ errors: 'Error al registrar la venta.' });
        }
    }
}

const cerrarVenta = async (req, res) => {
    await sequelize.authenticate();
    const t = await sequelize.transaction();

    try{
        const { id } = req.params;
        // Validar que el ID sea un número entero
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ errors: 'El ID debe ser un número entero válido.' });
        }

        const venta = await Venta.findByPk(id, {
            include: [
                {
                    model: models.Estado,
                    as: 'estado'
                },
                {
                    model: models.Persona,
                    attributes: ['dni', 'nombre'],
                    as: 'comprador'
                }
            ]
        });

        // Si la venta no existe, devolver un error 404
        if (!venta) {
            await t.rollback();
            return res.status(404).json({ errors: 'Venta no encontrada.' });
        }

        if(venta.estado.nombre !== 'Reservada'){
            await t.rollback();
            return res.status(404).json({ errors: 'Venta en estado incorrecto.' });
        }

        //asignar fecha de cierre y estado cerrada
        const fecha_actual = new Date().toISOString().split('T')[0];
        const updateVenta = {
            fecha_cierre: fecha_actual,
            id_estado: await EstadoController.obtenerIdEstadoPorParametro('Cerrada', 'Venta')
        }

        const inmueble = await models.Inmueble.findByPk(venta.id_inmueble, {
            attributes: ['id', 'id_estado', 'id_estado_anterior'],
            as: 'inmueble',
            include:[
                {
                    model: models.Estado,
                    attributes: ['id', 'nombre'],
                    as: 'estado'
                },
                {
                    model: models.Alquiler,
                    attributes: ['id', 'permite_venta'],
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
                },
                {
                    model: models.Persona,
                    attributes: ['dni'],
                    through: { attributes: [] } 
                }
            ]
        })

        let updateInmueble = {};
        
        //actualizar el estado de inmueble
        //if(inmueble.estado.nombre === 'Disponible Venta' || inmueble.estado.nombre === 'Disponible Venta y Alquiler'){
        if(inmueble.estado.nombre === 'Reservado'){
            const estadoActivo = await EstadoController.obtenerIdEstadoPorParametro("Activo", "General");
            updateInmueble = {
                id_estado: estadoActivo,
                id_estado_anterior: inmueble.id_estado
            };           
        }
        else if(inmueble.estado.nombre === 'Alquilado Reservado'){
            const estadoAlquilado = await EstadoController.obtenerIdEstadoPorParametro("Alquilado", "Inmueble");
            updateInmueble = {
                id_estado: estadoAlquilado,
                id_estado_anterior: inmueble.id_estado
            };  

            const id_alquiler = inmueble.Alquilers[0].id;
            
            try{
                //llamar a metodo que renueve el alquiler con otro propietario
                const result = await AlquilerController.copiarAlquilerNuevoPropietario(id_alquiler, venta.dni_comprador, fecha_actual, t);
                if (result.error) {
                    await t.rollback();
                    return res.status(400).json({ errors: result.error.message });
                }
            }
            catch(error){
                await t.rollback();
                return res.status(400).json({ errors: error.message });
            }
        }
        else{
            await t.rollback();
            return res.status(400).json({ errors: 'El Inmueble seleccionado no está en el estado correcto.'});
        }
        
        await venta.update(updateVenta, { transaction: t });

        await inmueble.update(updateInmueble, { transaction: t });

        //actualizar propietario del inmmueble
        inmueble.Personas.forEach(async propietario => {
            const venta_x_persona = {id_venta: venta.id, dni_persona: propietario.dni, es_comprador: false}
            await models.VentaXPersona.create(venta_x_persona, { transaction: t });
        })
        
        await models.InmuebleXPersona.destroy({where: {id_inmueble: venta.id_inmueble}}, { transaction: t });
        await models.InmuebleXPersona.create({id_inmueble: venta.id_inmueble, dni_persona: venta.dni_comprador}, { transaction: t });


        await t.commit();
        return res.status(201).json({ message: 'Cierre de venta exitoso.' });
    }
    catch(error){
        if (error.isJoi) {
            await t.rollback();
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessages });
        }
        if (!t.finished)
        {
            await t.rollback();
        }
        if (!res.headersSent){
            return res.status(500).json({ errors: 'Error al cerrar la venta.' });
        }
    }
}

const modificarVenta = async (req, res) => {
    await sequelize.authenticate();
    const t = await sequelize.transaction();
    let hayCambios = false;
    try{
        let { id }  = req.body;
        // Validar que el ID sea un número entero
        if (!Number.isInteger(Number(id))) {
            t.rollback();
            return res.status(400).json({ errors: 'El id de la venta debe ser un numero entero.' });
        }
        const ventaSel = await Venta.findByPk(id);
        if (!ventaSel){
            t.rollback();
            return res.status(404).json({ errors: 'No existe la venta seleccionada.' });
        }

        convertirVaciosAUndefined(req.body);
        const modificaciones_venta = construirVentaModificar(req.body);

        //convertir fecha venta a Date
        const fecha_venta = modificaciones_venta.fecha_venta;
        if (fecha_venta) {
            const isoDate = await convertirFechaAIso(fecha_venta, t, res, 'Fecha de Venta no válida.');
            if (isoDate) modificaciones_venta.fecha_venta = isoDate.split('T')[0];
        }

        //convertir fecha venta a Date
        const fecha_venta_original = ventaSel.fecha_venta;
        if (fecha_venta_original) {
            const isoDate = await convertirFechaAIso(fecha_venta_original, t, res, 'Fecha de Venta no válida.');
            if (isoDate) ventaSel.fecha_venta = isoDate.split('T')[0];
        }
    
        // Validar los datos recibidos usando Joi
        const { error: ventaError } = ModificarVentaSchema.validate(modificaciones_venta, { abortEarly: false });
    
        if (ventaError) {
            await t.rollback();
            const errorMessage = ventaError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessage });
        }

        if(ventaSel.monto_reserva >= ventaSel.precio_venta){
            await t.rollback();
            return res.status(400).json({ errors: 'La reserva no puede ser mayor al precio de venta!'});
        }

        //validar moneda
        const validacionMoneda = await MonedaController.validarMoneda(modificaciones_venta.id_moneda);
        if (!validacionMoneda.valid) {
            await t.rollback();
            return res.status(400).json({ errors: validacionMoneda.message });
        }

        //validar forma de pago
        const validacionFormaPago = await FormaPagoController.validarFormaPago(modificaciones_venta.id_forma_de_pago);
        if (!validacionFormaPago.valid) {
            await t.rollback();
            return res.status(400).json({ errors: validacionFormaPago.message });
        }

        convertirUndefinedAVacios(modificaciones_venta);
        let venta_changes = {};
        venta_changes = verificarCambios(ventaSel, modificaciones_venta);

        if (Object.keys(venta_changes).length > 0) {
            await ventaSel.update(venta_changes, { transaction: t });
            hayCambios = true;
        }
        // Confirmar la transacción
        const msgRes = (hayCambios ? `Modificación de venta exitosa.` : 'No hay cambios para actualizar.');
        await t.commit();
        const statusService = (hayCambios ? 201 : 200);
        return res.status(statusService).json({ message: msgRes});
    
    } catch(error){
        if (error.isJoi) {
            await t.rollback();
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessages });
        }
        if (!t.finished)
        {
            await t.rollback();
        }
        if (!res.headersSent){
            return res.status(500).json({ errors: 'Error al modificar la venta.' });
        }
    }
}

const getDetalleVenta = async (req, res) => {
    const { id } = req.params;
    // Validar que el ID sea un número entero
    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({ errors: 'El ID debe ser un número entero válido.' });
    }
    try{
        const venta = await Venta.findByPk(id, {
            include: [
                {
                    model: models.Inmueble,
                    attributes: ['id', 'codigo'],
                    as: 'inmueble',
                    include: [
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
                        }
                    ]
                },
                {
                    model: models.Persona,
                    attributes: ['dni', 'nombre'],
                    as: 'comprador'
                },
                {
                    model: models.Persona,
                    attributes: ['dni', 'nombre'],
                    through: { attributes: ['es_comprador'] },
                    as: 'personas'
                },
                {
                    model: models.Estado,
                    attributes: ['nombre'],
                    as: 'estado'
                },
                {
                    model: models.Moneda,
                    attributes: ['id', 'descripcion', 'nombre'],
                    as: 'moneda'
                },
                {
                    model: models.FormaDePago,
                    attributes: ['id', 'nombre'],
                    as: 'forma_de_pago'
                }
            ]
        });

        if (!venta) {
            return res.status(404).json({ errors: 'Venta no encontrada.' });
        }
  
        // armar y emprolijar el JSON
        const JSONVenta = venta.toJSON();

        const personas = JSONVenta.inmueble.Personas || [];
        JSONVenta.inmueble.propietarios = personas.map(persona => `${persona.nombre} - ${persona.dni}`).join(', ');
        JSONVenta.inmueble.direccion = `${JSONVenta.inmueble.direccion.calle} ${JSONVenta.inmueble.direccion.numero}, ${JSONVenta.inmueble.direccion.barrio}, ${JSONVenta.inmueble.direccion.localidad}`;
        JSONVenta.inmueble.tipo = obtenerTipoInmueble(JSONVenta.inmueble);

        //const propietarios = JSONVenta.personas.filter(propietario => propietario.venta_x_persona.es_comprador == false) || [];
        //const nombresPropietarios = propietarios.map(persona => `${persona.nombre} - ${persona.dni}`).join(', ');
        //JSONVenta.inmueble.nombresPropietarios = nombresPropietarios;

        JSONVenta.comprador.nombre_dni = `${JSONVenta.comprador.nombre} - ${JSONVenta.comprador.dni}`;

        const comision = JSONVenta.precio_venta * JSONVenta.porcentaje_comision / 100;
        JSONVenta.monto_reserva_moneda = concatenarMontoYMoneda(JSONVenta.monto_reserva, JSONVenta.moneda);
        JSONVenta.precio_venta_moneda = concatenarMontoYMoneda(JSONVenta.precio_venta, JSONVenta.moneda);
        JSONVenta.monto_comision = comision;
        JSONVenta.monto_comision_moneda = `${JSONVenta.moneda.descripcion} (${JSONVenta.moneda.nombre}) ${comision} (${JSONVenta.porcentaje_comision}%)`;

        if(venta.estado.nombre === 'Reservada' || venta.estado.nombre === 'Cancelada' ){
            const propietarios = JSONVenta.inmueble.Personas;
            const nombresPropietarios = propietarios.map(persona => `${persona.nombre} - ${persona.dni}`).join(', ');
            JSONVenta.inmueble.nombresPropietarios = nombresPropietarios;
            JSONVenta.personas = JSONVenta.inmueble.Personas;
        }
        else if(venta.estado.nombre === 'Cerrada'){
            const propietarios = JSONVenta.personas.filter(propietario => propietario.venta_x_persona.es_comprador == false) || [];
            const nombresPropietarios = propietarios.map(persona => `${persona.nombre} - ${persona.dni}`).join(', ');
            JSONVenta.inmueble.nombresPropietarios = nombresPropietarios;
        }
        else{
            JSONVenta.inmueble.nombresPropietarios = '';
        }

        res.status(200).json(JSONVenta);

    } catch (error){
        console.error('Error al obtener la venta por ID:', error);
        res.status(500).json({ errors: 'Error al obtener la venta por ID.' });
    }

}

const cancelarVenta = async (req, res) => {
    await sequelize.authenticate();
    const t = await sequelize.transaction();

    try{
        const { id } = req.params;
        // Validar que el ID sea un número entero
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ errors: 'El ID debe ser un número entero válido.' });
        }

        const venta = await Venta.findByPk(id, {
            include: [
                {
                    model: models.Estado,
                    as: 'estado' // Alias opcional si lo definiste en la asociación
                },
                {
                    model: models.Persona,
                    attributes: ['dni', 'nombre'],
                    as: 'comprador'
                },
                {
                    model: models.Inmueble,
                    attributes: ['id', 'id_estado', 'id_estado_anterior'],
                    as: 'inmueble',
                    include:[
                        {
                            model: models.Estado,
                            attributes: ['nombre'],
                            as: 'estado'
                        },
                    ]

                }
            ]
        });

        // Si la venta no existe, devolver un error 404
        if (!venta) {
            await t.rollback();
            return res.status(404).json({ errors: 'Venta no encontrada.' });
        }

        const inmueble = await models.Inmueble.findByPk(venta.id_inmueble);

        const { nombre: nombreEstadoVentaActual, tipo: tipoEstadoVentaActual } = venta.estado;
        let updateInmueble = {};
        let updateVenta = {};
        if (nombreEstadoVentaActual == "Reservada"  && tipoEstadoVentaActual == "Venta"){   

            // setear estado anterior al inmueble
            updateInmueble = {
                id_estado: venta.inmueble.id_estado_anterior,
                id_estado_anterior: venta.inmueble.id_estado
            }; 

            // setear estado cancelada en la venta
            const estadoCancelada = await EstadoController.obtenerIdEstadoPorParametro('Cancelada', 'Venta')
            updateVenta = {
                id_estado: estadoCancelada
            };     

            await inmueble.update(updateInmueble, { transaction: t });
            await venta.update(updateVenta, { transaction: t });

        } 
        else {
            await t.rollback();
            return res.status(404).json({ errors: `No es posible cancelar una venta en estado ${venta.estado.nombre}` });
        }

        await t.commit();
        return res.status(201).json({ message: 'Venta cancelada con éxito.' });

    } catch (error){
        await t.rollback();
        console.error('Error al cancelar la venta por ID:', error);
        res.status(500).json({ errors: 'Error al cancelar la venta por ID.' });
    }
}

const registrarVenta = async (req, res) => {

    await sequelize.authenticate();
    const t = await sequelize.transaction();

    try{
        const { id } = req.params;
        // Validar que el ID sea un número entero
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ errors: 'El ID debe ser un número entero válido.' });
        }



        //validar inmueble y su estado actual
        const validacionInmueble = await InmuebleController.validarInmueble(venta_nueva.id_inmueble, ['Disponible Venta', 'Disponible Venta y Alquiler', 'Alquilado']);
        if (!validacionInmueble.valid) {
            await t.rollback();
            return res.status(400).json({ errors: validacionInmueble.message });
        }
        const inmueble = await models.Inmueble.findByPk(venta_nueva.id_inmueble, {
            include: [            
                {
                    model: models.Persona,
                    attributes: ['dni'],
                    through: { attributes: [] } 
                },
                {
                    model: models.Estado,
                    attributes: ['nombre'],
                    as: 'estado'
                }
            ]
        });


        //asignar fecha de registro
        venta_nueva.fecha_registro = new Date().toISOString().split('T')[0];

        //asignar estado
        const id_estado_cerrada = await EstadoController.obtenerIdEstadoPorParametro('Cerrada', 'Venta')
        venta_nueva.id_estado = id_estado_cerrada;

        const venta = await Venta.create(venta_nueva, { transaction: t });
        let updateInmueble = {};

        //actualizar el estado de inmueble
        if(inmueble.estado.nombre === 'Disponible Venta' || inmueble.estado.nombre === 'Disponible Venta y Alquiler'){
            const estadoActivo = await EstadoController.obtenerIdEstadoPorParametro("Activo", "General");
            updateInmueble = {
                id_estado: estadoActivo,
                id_estado_anterior: inmueble.id_estado
            };           
        }
        else if(inmueble.estado.nombre === 'Alquilado'){
            //llamar a metodo que renueve el alquiler con otro propietario

        }

        await inmueble.update(updateInmueble, { transaction: t });

        //actualizar propietario del inmmueble
        inmueble.Personas.forEach(async propietario => {
            const venta_x_persona = {id_venta: venta.id, dni_persona: propietario.dni, es_comprador: false}
            await models.VentaXPersona.create(venta_x_persona, { transaction: t });
        })
        
        await models.InmuebleXPersona.destroy({where: {id_inmueble: venta_nueva.id_inmueble}}, { transaction: t });
        await models.InmuebleXPersona.create({id_inmueble: venta_nueva.id_inmueble, dni_persona: venta_nueva.dni_comprador}, { transaction: t });

        await t.commit();
        return res.status(201).json({ message: 'Registro de venta exitoso.' });

    }
    catch(error){
        if (error.isJoi) {
            await t.rollback();
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessages });
        }
        if (!t.finished)
        {
            await t.rollback();
        }
        if (!res.headersSent){
            return res.status(500).json({ errors: 'Error al registrar la venta.' });
        }
    }

}

module.exports = {
    getVentas,
    registrarReserva,
    cerrarVenta,
    modificarVenta,
    getDetalleVenta,
    cancelarVenta
};