const sequelize = require('../../config/connection'); 
const { models } = require('../models/index');
const { Op } = require("sequelize");
const Alquiler = require('../models/alquiler');
const Inmueble = require('../models/inmueble');
const Persona = require('../models/persona');
const GastoFijo = require('../models/gasto_fijo');
const Garantia = require('../models/garantia');
const { obtenerTipoInmueble, convertirDateADateOnly, convertirVaciosAUndefined, convertirFechaAIso, verificarCambios } = require('../utilities/functions');
const { RegistrarAlquilerSchema, updateAlquilerSchema } = require('../validators/alquilerValidator');
const { GastoFijoSchema } = require('../validators/gastoFijoValidator');
const { GarantiaSchema } = require('../validators/garantiavalidator');
const FormaDePago = require('../models/forma_de_pago');
const Estado = require('../models/estado');
const InmuebleController = require('./inmuebleController');
const PersonaController = require('./personaController');
const EstadoController = require('./estadoController');
const MonedaController = require('./monedaController');
const FormaPagoController = require('./formaPagoController');



const construirAlquiler = (data) => {
    const { numero_carpeta, fecha_inicio_contrato, fecha_fin_contrato, precio_inicial, id_moneda, periodo_actualizacion, 
        indice_actualizacion, porcentaje_actualizacion, dia_vencimiento_inquilino, dia_vencimiento_propietario, dia_inicial_mora, 
        porcentaje_mora_diaria, id_forma_de_pago, id_inmueble, dni_inquilino, dni_propietario_principal, permite_venta } = data;
    return { numero_carpeta, fecha_inicio_contrato, fecha_fin_contrato, precio_inicial, id_moneda, periodo_actualizacion, 
        indice_actualizacion, porcentaje_actualizacion, dia_vencimiento_inquilino, dia_vencimiento_propietario, dia_inicial_mora, 
        porcentaje_mora_diaria, id_forma_de_pago, id_inmueble, dni_inquilino, dni_propietario_principal, permite_venta }
}

const construirGastosFijos = (data, id_alquiler) => {
    const nuevos_gastos_fijos = [];
    data.forEach((gasto_fijo) => {
        nuevos_gastos_fijos.push({id_alquiler: id_alquiler, id_servicio: gasto_fijo.id, tipo_pago: gasto_fijo.tipo_pago, 
            dia_vencimiento: gasto_fijo.dia_vencimiento, numero_cliente: gasto_fijo.numero_cliente, 
            numero_contrato: gasto_fijo.numero_contrato});
    });
    return nuevos_gastos_fijos;
}

const construirCopiaGastosFijos = (data, id_alquiler) => {
    const nuevos_gastos_fijos = [];
    data.forEach((gasto_fijo) => {
        nuevos_gastos_fijos.push({id_alquiler: id_alquiler, id_servicio: gasto_fijo.id, tipo_pago: gasto_fijo.gasto_fijo.tipo_pago, 
            dia_vencimiento: gasto_fijo.gasto_fijo.dia_vencimiento, numero_cliente: gasto_fijo.gasto_fijo.numero_cliente, 
            numero_contrato: gasto_fijo.gasto_fijo.numero_contrato});
    });
    return nuevos_gastos_fijos;
}

const construirGarantias = (data, id_alquiler) => {
    const nuevas_garantias = [];
    data.forEach((garantia) => {
        nuevas_garantias.push({id_alquiler, dni_responsable: garantia.dni_responsable, tipo: garantia.tipo, 
            numero_escritura: garantia.numero_escritura});
    });
    return nuevas_garantias;
}

// Función para obtener el tipo de gasto fijo 
const obtenerNombreTipoGastoFijo = (tipo) => {
    if (tipo == 0) {
        return 'Paga Inmobiliaria';
    } else if (tipo == 1) {
        return 'Paga Propietario';
    } else if (tipo == 2) {
        return 'Paga Inquilino';
    } else {
        return '';
    }
};

const obtenerNombreTipoGarantia= (tipo) => {
    if (tipo == 0) {
        return 'Recibo de Sueldo';
    } else if (tipo == 1) {
        return 'Propietaria';
    } else {
        return '';
    }
};

const obtenerEstado = async (estado) => {
    const estadosValidos = ["Disponible Alquiler", "Disponible Venta", "Disponible Venta y Alquiler", "Activo"];
    if (!estadosValidos.includes(estado)) return -1;
    const tipo = (estado == 'Activo' ? 'General' : 'Inmueble');
    return await gestor_estados.obtenerIdEstadoPorParametro(estado, tipo);
};

const obtenerEstadoModificar = async (estado) => {
    const estadosInvalidos = ["Inactivo"];
    if (estadosInvalidos.includes(estado)) return -1;
    const tipo = ((estado == 'Activo' || estado == 'Alquilado' || estado == 'Vendido') ? 'General' : 'Inmueble');
    return await gestor_estados.obtenerIdEstadoPorParametro(estado, tipo);
};

const poseePagos = async (alquiler) => {
    const pagos = await models.PagoAlquiler.findAll({
        attributes: ['id_alquiler', 'id_estado'],
        where:{
            id_alquiler: alquiler.id
        }
    });
    return pagos.length > 0; 
}

const puedeModificar = async (alquiler) => {
    const estadosValidos = ["Vigente", "Por Iniciar"];
    if (!estadosValidos.includes(alquiler.estado.nombre)) return false;
    if (alquiler.estado.nombre == "Vigente"){
        const tieneP = await poseePagos(alquiler);  // Usa await para esperar el resultado
        if (tieneP) return false;  // Si tiene pagos, no se puede modificar
        return true; 
    }
        
    if (alquiler.estado.nombre == "Por Iniciar")
        return true;
    return false;
}

const obtenerEstadoModificarAlquiler = async (estado) => {
    const estadosInvalidos = ["Cancelado"];
    if (estadosInvalidos.includes(estado)) return -1;
    const tipo = "Alquiler";
    return await EstadoController.obtenerIdEstadoPorParametro(estado, tipo);
};

const validarFormaPago = (pago) => {
    const camposValido = ['Efectivo', 'Transferencia'];
    if (camposValido.includes(pago)) return true; 
    return false;
}

const getAlquileres = async (req, res) => {
    try {
        await sequelize.authenticate();

        const alquileres = await Alquiler.findAll({
            attributes:['id', 'numero_carpeta', 'fecha_fin_contrato'],
            include: [
                {
                    model: models.Estado,
                    attributes: ['nombre'],
                    as: 'estado'
                },
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
                    as: 'persona'
                }
            ]
        });

        // determinar el tipo del inmueble de cada alquiler y agregar nombresPropietarios 
        const resultado = await Promise.all(alquileres.map(async (alquiler) => {
            const JSONAlquiler = alquiler.toJSON();

            const propietarios = JSONAlquiler.inmueble.Personas || [];
            const nombresPropietarios = propietarios.map(persona => `${persona.nombre} - ${persona.dni}`).join(', ');

            const inquilino = `${JSONAlquiler.persona.nombre} - ${JSONAlquiler.persona.dni}`;

            JSONAlquiler.inmueble.nombresPropietarios = nombresPropietarios;
            JSONAlquiler.inmueble.tipo = obtenerTipoInmueble(alquiler.inmueble);

            JSONAlquiler.inmueble.direccion = `${JSONAlquiler.inmueble.direccion.barrio} - ${JSONAlquiler.inmueble.direccion.localidad}`;

            delete JSONAlquiler.inmueble.Personas;
            delete JSONAlquiler.persona;
            // Esperar a que la promesa de puedeModificar se resuelva
            const esModificable = await puedeModificar(alquiler);
            JSONAlquiler.modificable = esModificable
            return {
                ...JSONAlquiler,
                //tipo: obtenerTipoInmueble(alquiler.inmueble),
                //nombresPropietarios,
                inquilino
            };
        
        }));

        return res.json(resultado);

    } catch (error) {
        console.error('Error al obtener los alquileres:', error);
        return res.status(500).json({ errors: 'Error al obtener las alquileres.' });
    }
};

const redondearFechaActualizacion = (fecha) => {
    if(fecha.getDate() >= 20){
        //fecha.setMonth(fecha.getMonth() + 1);
        fecha.setDate(fecha.getDate() + 15 );
        fecha.setDate(1);
    }
    return fecha;
}

const generarFechasActualizacionConCosto = (fecha_inicio, fecha_fin, precio_inicial, periodo, porcentaje_actualizacion) => {
    let actualizaciones = [];
    

    let fecha_desde = new Date(fecha_inicio);
    const fecha_hasta = new Date(fecha_fin);
    let precio_base = precio_inicial;

    while(true){

        let proxima_fecha = new Date(fecha_desde);
        proxima_fecha.setMonth(fecha_desde.getMonth()+ periodo);
        proxima_fecha = redondearFechaActualizacion(proxima_fecha);
        
        if (proxima_fecha >= fecha_hasta){
            break;
        }

        const actualizacion = {
            fecha: convertirDateADateOnly(proxima_fecha),
            monto: precio_base + (precio_base * porcentaje_actualizacion / 100 ),
            valor: precio_base + (precio_base * porcentaje_actualizacion / 100 )
        };

        actualizaciones.push(actualizacion);

        fecha_desde = new Date(proxima_fecha);

        precio_base = actualizacion.monto;
    }

    return actualizaciones;

};

const generarFechasActualizacion = (fecha_inicio, fecha_fin, periodo) => {
    let actualizaciones = [];

    let fecha_desde = new Date(fecha_inicio);
    const fecha_hasta = new Date(fecha_fin);

    while(true){

        let proxima_fecha = new Date(fecha_desde);
        proxima_fecha.setMonth(fecha_desde.getMonth()+ periodo);
        proxima_fecha = redondearFechaActualizacion(proxima_fecha);
        
        if (proxima_fecha >= fecha_hasta){
            break;
        }

        const actualizacion = {
            fecha: convertirDateADateOnly(proxima_fecha),
            monto: "A Calcular."
        };

        actualizaciones.push(actualizacion);

        fecha_desde = new Date(proxima_fecha);
    }

    return actualizaciones;

};

const concatenarMontosActualizacionYMoneda = (fechas, moneda) => {
    
    fechas.forEach((fecha) => { 
        fecha.monto = `${moneda.descripcion} (${moneda.nombre}) ${fecha.monto}`
    });
     
}

const obtenerDetalleAlquiler = async (req, res) => {
    const { id } = req.params;
  
    // Validar que el ID sea un número entero
    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({ errors: 'El ID debe ser un número entero válido.' });
    }
  
    try {
        // Utilizar Sequelize para buscar el alquiler por ID
        
        const alquiler = await Alquiler.findByPk(id, {
            include: [
                {
                    model: models.Estado,
                    attributes: ['nombre'],
                    as: 'estado'
                },
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
                            attributes: ['numero', 'calle', 'barrio', 'localidad', 'provincia'],
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
                    as: 'persona'
                },
                {
                    model: models.Moneda,
                    attributes: ['descripcion', 'nombre'],
                    as: 'moneda'
                },
                {
                    model: models.FormaDePago,
                    attributes: ['nombre'],
                    as: 'forma_de_pago'
                },
                {
                    model: models.Servicio,
                    attributes: ['nombre'],
                    through: { attributes: ['tipo_pago', 'dia_vencimiento', 'numero_cliente', 'numero_contrato'] },
                },
                {
                    model: models.Garantia,
                    attributes: ['tipo', 'numero_escritura'],
                    as: 'garantias',
                    include: [
                        {
                            model: models.Persona,
                            attributes: ['nombre', 'dni', 'celular'],
                            as:'responsable'
                        }
                    ]
                }
    
            ]
        });

        if (!alquiler) {
            return res.status(404).json({ errors: 'Alquiler no encontrado.' });
        }
  
        // armar y emprolijar el JSON
        const JSONAlquiler = alquiler.toJSON();

        //cambiar nombre de campo inquilino
        JSONAlquiler.inquilino = JSONAlquiler.persona;
        delete JSONAlquiler.persona;

        //cambiar nombre propietarios        
        JSONAlquiler.inmueble.propietarios = JSONAlquiler.inmueble.Personas || [];
        delete JSONAlquiler.inmueble.Personas;

        //concatenar datos direccion
        JSONAlquiler.inmueble.resumen_direccion = `${JSONAlquiler.inmueble.direccion.calle}, ${JSONAlquiler.inmueble.direccion.numero}`;
        JSONAlquiler.inmueble.localidad_barrio = `${JSONAlquiler.inmueble.direccion.localidad}, ${JSONAlquiler.inmueble.direccion.barrio}`;

        if(JSONAlquiler.indice_actualizacion === 'Personalizado'){
            JSONAlquiler.fechas_actualizacion = generarFechasActualizacionConCosto(alquiler.fecha_inicio_contrato, 
                alquiler.fecha_fin_contrato, alquiler.precio_inicial, 
                alquiler.periodo_actualizacion, alquiler.porcentaje_actualizacion);

                concatenarMontosActualizacionYMoneda(JSONAlquiler.fechas_actualizacion, alquiler.moneda);
        }
        else{
            JSONAlquiler.fechas_actualizacion = generarFechasActualizacion(alquiler.fecha_inicio_contrato, 
                alquiler.fecha_fin_contrato, alquiler.periodo_actualizacion)
        }

        JSONAlquiler.inmueble.tipo = obtenerTipoInmueble(alquiler.inmueble);

        JSONAlquiler.garantias.forEach((garantia) => {
            garantia.tipo = obtenerNombreTipoGarantia(garantia.tipo);
            garantia.resumen_responsable = `${garantia.responsable.nombre} - Tel: ${garantia.responsable.celular}`;
        });

        JSONAlquiler.Servicios.forEach((servicio) => {
            servicio.gasto_fijo.tipo_pago = obtenerNombreTipoGastoFijo(servicio.gasto_fijo.tipo_pago);
            servicio.gasto_fijo.nombre = servicio.nombre;
            delete servicio.nombre;
        });

      res.status(200).json(JSONAlquiler);

    } catch (error) {
        console.error('Error al obtener el alquiler por ID:', error);
        res.status(500).json({ errors: 'Error al obtener el alquiler por ID.' });
    }
};

const registrarAlquiler = async (req, res) => {

    await sequelize.authenticate();
    const t = await sequelize.transaction();

    try{
        // Convertir campos vacíos a undefined
        convertirVaciosAUndefined(req.body);

        // Extraer datos de alquiler del cuerpo de la solicitud y juntarlos
        const alquiler_nuevo = construirAlquiler(req.body);

        try{
            let dateInicio = new Date(alquiler_nuevo.fecha_inicio_contrato);
            let dateFin = new Date(alquiler_nuevo.fecha_fin_contrato);
            // Calculating the time difference of two dates
            let Difference_In_Time = dateFin.getTime() - dateInicio.getTime();
            // Calculating the no. of days between two dates
            let Difference_In_Days = Math.round(Difference_In_Time / (1000 * 3600 * 24));
            if (Difference_In_Days < 30){
                await t.rollback();
                return res.status(400).json({ errors: 'El plazo mínimo del contrato debe ser de 1 mes.'});
            }
        }
        catch (validationError) {
            await t.rollback();
            return res.status(400).json({ errors: 'Las fechas del contrato no son validas.'});
        }

        //convertir fecha inicio contrato a Date
        const fecha_inicio_contrato = alquiler_nuevo.fecha_inicio_contrato;
        if (fecha_inicio_contrato) {
            const isoDate = await convertirFechaAIso(fecha_inicio_contrato, t, res, 'Fecha Inicio de Contrato no válida.');
            if (isoDate) alquiler_nuevo.fecha_inicio_contrato = isoDate;
        }
    
        const fecha_fin_contrato = alquiler_nuevo.fecha_fin_contrato;
        if (fecha_fin_contrato) {
            const isoDate = await convertirFechaAIso(fecha_fin_contrato, t, res, 'Fecha Fín de Contrato no válida.');
            if (isoDate) alquiler_nuevo.fecha_fin_contrato = isoDate;
        }

        //asignar fecha de registro
        alquiler_nuevo.fecha_registro = new Date().toISOString().split('T')[0];

        // asignar permite venta false si viene null
        alquiler_nuevo.permite_venta = alquiler_nuevo.permite_venta != null? alquiler_nuevo.permite_venta : false 

        // Validar los datos recibidos usando Joi
        const { error: alquilerError, value: alquilerValue } = RegistrarAlquilerSchema.validate(alquiler_nuevo, { abortEarly: false });

        if (alquilerError) {
            await t.rollback();
            const errorMessage = alquilerError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessage });
        }

        //validar inmueble y su estado actual
        const validacionInmueble = await InmuebleController.validarInmueble(alquiler_nuevo.id_inmueble, ['Disponible Alquiler', 'Disponible Venta y Alquiler']);
        if (!validacionInmueble.valid) {
            await t.rollback();
            return res.status(400).json({ errors: validacionInmueble.message });
        }
        const inmueble = await Inmueble.findByPk(alquiler_nuevo.id_inmueble, {
            include: {
                model: models.Persona,
                attributes: ['dni'],
                through: { attributes: [] } 
            }
        });

        const dnis_propietarios = [];
        inmueble.Personas.forEach(propietario => {
            dnis_propietarios.push(propietario.dni);
        });

        //validar propietario principal
        if(!dnis_propietarios.includes(alquiler_nuevo.dni_propietario_principal)){
            await t.rollback();
            return res.status(400).json({ errors: 'La persona seleccionada como propietario principal no es propietario del inmueble.' });
        }

        //validar inquilino
        const validacionInquilino = await PersonaController.validarPersona(alquiler_nuevo.dni_inquilino);
        if (!validacionInquilino.valid) {
            await t.rollback();
            return res.status(400).json({ errors: validacionInquilino.message.concat(' (Inquilino)') });
        }

        if(dnis_propietarios.includes(alquiler_nuevo.dni_inquilino)){
            await t.rollback();
            return res.status(400).json({ errors: 'La persona seleccionada como inquilino es propietario del inmueble.' });
        }

        //validar estado alquiler
        //const validacionEstadoAlquiler = await EstadoController.validarEstado(alquiler_nuevo.id_estado, ['Vigente', 'Por Iniciar']);
        //if (!validacionEstadoAlquiler.valid) {
        //    await t.rollback();
        //    return res.status(400).json({ errors: validacionEstadoAlquiler.message });
        //}

        //validar moneda
        const validacionMoneda = await MonedaController.validarMoneda(alquiler_nuevo.id_moneda);
        if (!validacionMoneda.valid) {
            await t.rollback();
            return res.status(400).json({ errors: validacionMoneda.message });
        }

        //validar forma de pago
        const validacionFormaPago = await FormaPagoController.validarFormaPago(alquiler_nuevo.id_forma_de_pago);
        if (!validacionFormaPago.valid) {
            await t.rollback();
            return res.status(400).json({ errors: validacionFormaPago.message });
        }
        
        // Setear el estado segun la fecha
        if(alquiler_nuevo.fecha_registro >= alquiler_nuevo.fecha_inicio_contrato){
            alquiler_nuevo.id_estado = await EstadoController.obtenerIdEstadoPorParametro("Vigente", "Alquiler")
        }
        else{
            alquiler_nuevo.id_estado = await EstadoController.obtenerIdEstadoPorParametro("Por Iniciar", "Alquiler")
        }

        // verificar si no es personalizado y eliminar porcentaje
        if(alquiler_nuevo.indice_actualizacion !== 'Personalizado'){
            alquiler_nuevo.porcentaje_actualizacion = null;
        }

        // todo validar y setear propietario principal
        alquiler_nuevo.dni_propietario_principal = inmueble.Personas[0].dni;

        const alquiler = await Alquiler.create(alquiler_nuevo, { transaction: t });

        // Armar y validar Gastos Fijos
        const gastos_fijos = construirGastosFijos(req.body.gastos_fijos, alquiler.id);
        const erroresGastosFijos = [];

        for (const gasto_fijo of gastos_fijos) {
            convertirVaciosAUndefined(gasto_fijo);
            try {
                const { error: gastoFijoError } = GastoFijoSchema.validate(gasto_fijo, { abortEarly: false });
                if (gastoFijoError) {
                    erroresGastosFijos.push(...gastoFijoError.details.map(detail => detail.message));
                } else {
                    await GastoFijo.create(gasto_fijo, { transaction: t });
                }
            } catch (validationError) {
                erroresGastosFijos.push(validationError.message);
            }
        }

        if (erroresGastosFijos.length > 0) {
            await t.rollback();
            return res.status(400).json({ errors: erroresGastosFijos });
        }

        // Armar y validar Garantias
        const garantias = construirGarantias(req.body.garantias, alquiler.id);
        const erroresGarantias = [];

        for (const garantia of garantias) {
            convertirVaciosAUndefined(garantia);
            try {
                const { error: garantiaError } = GarantiaSchema.validate(garantia, { abortEarly: false });
                //validar responsable
                const validacionResponsable = await PersonaController.validarPersona(garantia.dni_responsable);

                if (garantiaError) {
                    erroresGarantias.push(...garantiaError.details.map(detail => detail.message));
                }
                else if (!validacionResponsable.valid) {
                    erroresGarantias.push( validacionResponsable.message.concat(' (Responsable Garantía)') );
                }
                else {
                    await Garantia.create(garantia, { transaction: t });
                }
            } catch (validationError) {
                erroresGarantias.push(validationError.message);
            }
        }

        if (erroresGarantias.length > 0) {
            await t.rollback();
            return res.status(400).json({ errors: erroresGarantias });
        }

        //actualizar el estado de inmueble
        const estadoAlquilado = await EstadoController.obtenerIdEstadoPorParametro("Alquilado", "Inmueble");
        
        const updateInmueble= {
            id_estado: estadoAlquilado,
            id_estado_anterior: inmueble.id_estado
        };
        await inmueble.update(updateInmueble, { transaction: t });

        await t.commit();
        return res.status(201).json({ message: 'Registro de alquiler exitoso.' });

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
            return res.status(500).json({ errors: 'Error al registrar el alquiler.' });
        }
    }

}

const modificarAlquiler = async (req, res) => {
    await sequelize.authenticate();
    const t = await sequelize.transaction();
    let hayCambios = false;
    try {
        let { id }  = req.body;
        // Validar que el ID sea un número entero
        if (!Number.isInteger(Number(id))) {
            t.rollback();
            return res.status(400).json({ errors: 'Error al aplicar los cambios del Alquiler.' });
        }
        const alquilerSel = await Alquiler.findByPk(id);
        if (!alquilerSel){
            t.rollback();
            return res.status(400).json({ errors: 'Error al aplicar los cambios del Alquiler.' });
        }
        const realizaPagos = await poseePagos(alquilerSel);
        if (realizaPagos == true){
            t.rollback();
            return res.status(400).json({ errors: 'No se puede modificar un Alquiler una vez realizado un Pago.' });
        }
        // Convertir campos vacíos a undefined
        convertirVaciosAUndefined(req.body);
        let { id_inmueble}  = req.body;
        // Validar que el ID sea un número entero
        if (!Number.isInteger(Number(id_inmueble))) {
            t.rollback();
            return res.status(400).json({ errors: 'Error al aplicar los cambios del Inmueble.' });
        }
        const estadoActual = await Estado.findByPk(alquilerSel.id_estado);
        if (!estadoActual){
            await t.rollback();
            return res.status(400).json({ errors: 'El estado del Alquiler es inválido.'});
        }
        const inmuebleSel = await models.Inmueble.findOne({
            where: {
                id: id_inmueble
            }});
        if (!inmuebleSel){
            await t.rollback();
            return res.status(400).json({ errors: 'El Alquiler no posee un Inmueble válido.'});
        }
        const estadoPermiteModificar = await obtenerEstadoModificarAlquiler(estadoActual.nombre);
        if (estadoPermiteModificar === -1) {
            await t.rollback();
            return res.status(500).json({ errors: `No se puede modificar un Alquiler con estado ${estadoActual.nombre}.`});
        }
        // Extraer datos de alquiler del cuerpo de la solicitud y juntarlos
        const alquilerNuevo = construirAlquiler(req.body);
        convertirVaciosAUndefined(alquilerNuevo);
        //convertir fecha inicio contrato a Date
        try{
            let dateInicio = new Date(alquilerNuevo.fecha_inicio_contrato);
            let dateFin = new Date(alquilerNuevo.fecha_fin_contrato);
            // Calculating the time difference of two dates
            let Difference_In_Time = dateFin.getTime() - dateInicio.getTime();
            // Calculating the no. of days between two dates
            let Difference_In_Days = Math.round(Difference_In_Time / (1000 * 3600 * 24));
            if (Difference_In_Days < 30){
                await t.rollback();
                return res.status(400).json({ errors: 'El plazo mínimo del contrato debe ser de 6 meses.'});
            }
        }
        catch (validationError) {
            await t.rollback();
            return res.status(400).json({ errors: 'Las fechas del contrato no son validas.'});
        }
        const fecha_inicio_contrato = alquilerNuevo.fecha_inicio_contrato;
        if (fecha_inicio_contrato) {
            const isoDate = await convertirFechaAIso(fecha_inicio_contrato, t, res, 'Fecha Inicio de Contrato no válida.');
            if (isoDate) alquilerNuevo.fecha_inicio_contrato = isoDate;
        }
        else
        {
            await t.rollback();
            return res.status(400).json({ errors: 'La Fecha de Inicio de Contrato es obligatoria.' });
        }
        const fecha_fin_contrato = alquilerNuevo.fecha_fin_contrato;
        if (fecha_fin_contrato) {
            const isoDate = await convertirFechaAIso(fecha_fin_contrato, t, res, 'Fecha Fín de Contrato no válida.');
            if (isoDate) alquilerNuevo.fecha_fin_contrato = isoDate;
        }
        else
        {
            await t.rollback();
            return res.status(400).json({ errors: 'La Fecha de Fin de Contrato es obligatoria.' });
        }
        if (alquilerNuevo.fecha_inicio_contrato >= alquilerNuevo.fecha_fin_contrato){
            await t.rollback();
            return res.status(400).json({ errors: 'La fecha de Fin del contrato debe ser posterior a la fecha de Inicio.'});
        }
        // Validar los datos recibidos usando Joi
        let alquilerChanges = {}
        let alquilerValue = null;
        const { error: alquilerError, value: alquilerValidated } = updateAlquilerSchema.validate(alquilerNuevo, { abortEarly: false });
        if (alquilerError){
            await t.rollback();
            const errorsAlquiler = alquilerError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorsAlquiler });
        }
        alquilerValue = alquilerValidated;
        alquilerValue.fecha_inicio_contrato = fecha_inicio_contrato;
        alquilerValue.fecha_fin_contrato = fecha_fin_contrato;
        alquilerChanges = verificarCambios(alquilerSel, alquilerValue);
        const moneda = await models.Moneda.findByPk(alquilerNuevo.id_moneda);                    
        if (!moneda){
            await t.rollback();
            return res.status(500).json({ errors: `La moneda seleccionada para el alquiler no existe.` });
        };
        //validar forma de pago
        const validacionFormaPago = await FormaPagoController.validarFormaPago(alquilerNuevo.id_forma_de_pago);
        if (!validacionFormaPago.valid) {
            await t.rollback();
            return res.status(400).json({ errors: validacionFormaPago.message });
        }
        // Armar y validar Gastos Fijos
        if (!req.body.gastos_fijos)
        {
            await t.rollback();
            return res.status(500).json({ errors: `Error al cargar los Gastos Fijos.` });
        }
        const gastos_fijos = construirGastosFijos(req.body.gastos_fijos, id);
        const erroresGastosFijos = [];
        const posee_gastos = await GastoFijo.findAll({
            attributes: ['id_servicio'],
            where: {
                id_alquiler: id
            }
        });
        let gastos_nuevos = [];
        let gastos_existentes = [];
        if (gastos_fijos.length > 0){
            gastos_fijos.forEach((gasto) => {
                gastos_nuevos.push(gasto.id_servicio);
           })
        }
        if (posee_gastos.length > 0){
            posee_gastos.forEach((gasto) => {
                gastos_existentes.push(gasto.id_servicio);
            })
        }
        let gastos_repetidos = [];
        let gastos_crear = [];
        for (var i = 0; i < gastos_nuevos.length; i++) {
            if (gastos_existentes.includes(gastos_nuevos[i]))
                gastos_repetidos.push(gastos_nuevos[i])
            else
                gastos_crear.push(gastos_nuevos[i])
        }
        let cambiosGastos = {};
        if (gastos_fijos.length > 0){
            for (const gasto_fijo of gastos_fijos) {
                let gastoValue = null;
                convertirVaciosAUndefined(gasto_fijo);
                try {
                    const { error: gastoError, value: gastoValidated } = GastoFijoSchema.validate(gasto_fijo, { abortEarly: false });
                    if (gastoError){
                        erroresGastosFijos.push(...gastoError.details.map(detail => detail.message));
                    }
                    gastoValue = gastoValidated;
                    const gastoFijoPrecio = await GastoFijo.findOne({
                        where: {
                            id_alquiler: id,
                            id_servicio: gasto_fijo.id_servicio
                        }
                    })
                    if (gastoValue.numero_cliente == undefined)
                        gastoValue.numero_cliente = '';
                    if (gastoValue.numero_contrato == undefined)
                        gastoValue.numero_contrato = '';
                    if (gastoFijoPrecio){
                        cambiosGastos = {};
                        if (gastoFijoPrecio.numero_cliente != '')
                            gastoFijoPrecio.numero_cliente = parseInt(gastoFijoPrecio.numero_cliente)
                        if (gastoFijoPrecio.numero_contrato != '')
                            gastoFijoPrecio.numero_contrato = parseInt(gastoFijoPrecio.numero_contrato)
                        cambiosGastos = verificarCambios(gastoFijoPrecio, gastoValue);
                        if (Object.keys(cambiosGastos).length > 0){
                            hayCambios = true;
                            await gastoFijoPrecio.update(cambiosGastos)
                        }
                    }
                    else{
                        await GastoFijo.create(gastoValue, { transaction: t });
                        hayCambios = true;
                    }
                } catch (validationError) {
                    erroresGastosFijos.push(validationError.message);
                }
            }
        }
        else
        {
            await t.rollback();
            return res.status(400).json({ errors: 'Es obligatoria la selección de Gastos Fijos.' });
        }
        if (erroresGastosFijos.length > 0) {
            await t.rollback();
            return res.status(400).json({ errors: erroresGastosFijos });
        }
        let gastos_eliminar = [];
        for (var i = 0; i < gastos_existentes.length; i++) {
            if (!gastos_repetidos.includes(gastos_existentes[i]) && !gastos_crear.includes(gastos_existentes[i]))
                gastos_eliminar.push(gastos_existentes[i])
        }
        if (gastos_eliminar.length > 0){
             //Elimino los gastos que se quitaron
            try {
                await GastoFijo.destroy({
                    where: {
                        id_alquiler: id,
                        id_servicio: { [Op.in]: servicios_eliminar }
                    }
                });
                hayCambios = true;
            } 
            catch (validationError) {
                t.rollback()
                return res.status(400).json({ errors: validationError.message });
            }
        }
        // Armar y validar Garantias
        const garantias = construirGarantias(req.body.garantias, id);
        const posee_garantias = await Garantia.findAll({
            attributes: { exclude: ['id'] },
            where: {
                id_alquiler: id
            }
        });
        let garantias_nuevos = [];
        let garantias_previas = [];
        if (garantias.length > 0){
            garantias.forEach((garantia) => {
                let garantiaObject = {
                    id_alquiler: garantia.id_alquiler,
                    dni_responsable: garantia.dni_responsable,
                    tipo: parseInt(garantia.tipo),
                    numero_escritura: garantia.numero_escritura
                }
                garantias_nuevos.push(garantiaObject);
           })
        }
        if (posee_garantias.length > 0){
            posee_garantias.forEach((garantia) => {
                let garantiaPreviaObject = {
                    id_alquiler: garantia.id_alquiler,
                    dni_responsable: garantia.dni_responsable,
                    tipo: garantia.tipo,
                    numero_escritura: garantia.numero_escritura
                }
                garantias_previas.push(garantiaPreviaObject);
           })
        }
        const erroresGarantias = [];
        let cambiosGarantias = false;
        if (!(JSON.stringify(garantias_nuevos) == JSON.stringify(garantias_previas))){
            cambiosGarantias = true;
            if (garantias.length > 0)
            {
                for (const garantia of garantias) {
                    convertirVaciosAUndefined(garantia);
                    try {
                        for(const garantia of garantias){
                            try
                            {
                                const { error: garantiaError, value: garantiaValidated } = GarantiaSchema.validate(garantia, { abortEarly: false });
                                if (garantiaError){
                                    erroresGarantias.push(...garantiaError.details.map(detail => detail.message));
                                }
                            }
                            catch (validationError) {
                                erroresGarantias.push(validationError.message);
                            }
                        }
                    } catch (validationError) {
                        erroresGarantias.push(validationError.message);
                    }
                }
            }
            else
            {
                await t.rollback();
                return res.status(400).json({ errors: 'Es obligatoria la carga de Garantías.' });
            }
        }
        if (erroresGarantias.length > 0) {
            await t.rollback();
            return res.status(400).json({ errors: erroresGarantias });
        }

        //Elimino las garantías
        if (cambiosGarantias){
            hayCambios = true;
            try
            {
                await Garantia.destroy({
                    where: {
                        id_alquiler: id
                    }
                });
                for (const garantia of garantias) {
                    try 
                    {
                        await Garantia.create(garantia, { transaction: t });
                    }
                    catch (validationError) {
                        await t.rollback();
                        return res.status(400).json({ errors: 'Error en la carga de Garantías.' });
                    }           
                }
            }
            catch (validationError) {
                await t.rollback();
                return res.status(400).json({ errors: 'Error en la carga de Garantías.' });
            }
        }
        try {
            // Actualizar la dirección si hay cambios
            if (Object.keys(alquilerChanges).length > 0) {
                await alquilerSel.update(alquilerChanges, { transaction: t });
                hayCambios = true;
            }
        }
        catch (validationError) {
            t.rollback()
            return res.status(400).json({ errors: validationError.message });
        }
        // Confirmar la transacción
        const msgRes = (hayCambios ? `Modificación de alquiler exitoso.` : 'No hay cambios para actualizar.');
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
        return res.status(500).json({ errors: 'Error al modificar el alquiler.' });
    }
}

const cancelarAlquiler = async (req, res) =>{
    await sequelize.authenticate();
    const t = await sequelize.transaction();
    try {
        let { id }  = req.body;
        // Validar que el ID sea un número entero
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ errors: 'Error al aplicar los cambios del Alquiler.' });
        }
        try {
            const alquilerSel = await Alquiler.findByPk(id, {
                include: [
                    {
                        model: Estado,
                        as: 'estado' 
                    }
                ]
            });
            if (!alquilerSel){
                await t.rollback();
                return res.status(400).json({ errors: 'El Alquiler seleccionado no existe.'});
            }
            let nombreEstadoAlquilerActual = alquilerSel.estado.nombre;
            let tipoEstadoAlquilerActual = alquilerSel.estado.tipo;
            let nuevoValor = -1;
            if(nombreEstadoAlquilerActual != "Cancelado" && tipoEstadoAlquilerActual == "Alquiler"){ 
                nuevoValor = await EstadoController.obtenerIdEstadoPorParametro('Cancelado', 'Alquiler');
            }
            if (nuevoValor == -1 || nuevoValor == alquilerSel.id_estado){
                await t.rollback();
                return res.status(400).json({ errors: 'El Alquiler ya se encuentra Cancelado.'});
            }
            const hoy = new Date();
            const dia = String(hoy.getDate()).padStart(2, '0'); // Obtener el día y rellenar con 0 si es necesario
            const mes = String(hoy.getMonth() + 1).padStart(2, '0'); // Los meses empiezan desde 0, por eso sumamos 1
            const año = hoy.getFullYear();
            const fecha_cancelacion_contrato = `${año}-${mes}-${dia}`;
            const updateAlquiler = {
                id_estado: nuevoValor,
                fecha_cancelacion_contrato: fecha_cancelacion_contrato
            }
            try 
            {
                const inmuebleAlquiler = await Inmueble.findByPk(alquilerSel.id_inmueble);
                if (!inmuebleAlquiler){
                    await t.rollback();
                    return res.status(400).json({ errors: 'El Alquiler seleccionado no posee un Inmueble.'});
                }
                const idEstadoActivo = await EstadoController.obtenerIdEstadoActivoGeneral();
                if (!idEstadoActivo){
                    await t.rollback();
                    return res.status(400).json({ errors: 'El Alquiler seleccionado no posee un Inmueble válido.'});
                }
                const updateInmueble = {
                    id_estado_anterior: inmuebleAlquiler.id_estado,
                    id_estado: idEstadoActivo
                }
                await inmuebleAlquiler.update(updateInmueble);
                await alquilerSel.update(updateAlquiler);
            }
            catch (validationError) {
                t.rollback()
                return res.status(400).json({ errors: validationError.message });
            }
        }
        catch (validationError) {
            t.rollback()
            return res.status(400).json({ errors: validationError.message });
        }
        return res.status(200).json({ message: 'Alquiler modificado con éxito.'});
    } 
    catch (error) {
        if (t)
        {
            await t.rollback();
        }        
        return res.status(500).json({ errors: 'Error al modificar el alquiler.' });
    }
}

const obtenerDatosAlquiler = async (req, res) => {
    const { id } = req.params;
    // Validar que el ID sea un número entero
    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({ errors: 'El ID debe ser un número entero válido.' });
    }
    try {
        // Utilizar Sequelize para buscar el alquiler por ID   
        const alquiler = await Alquiler.findByPk(id, {
            include: [
                {
                    model: models.Estado,
                    attributes: ['nombre'],
                    as: 'estado'
                },
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
                            attributes: ['numero', 'calle', 'barrio', 'localidad', 'provincia'],
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
                    as: 'persona'
                },
                {
                    model: models.Moneda,
                    attributes: ['descripcion', 'nombre'],
                    as: 'moneda'
                },
                {
                    model: models.FormaDePago,
                    attributes: ['nombre'],
                    as: 'forma_de_pago'
                },
                {
                    model: models.Servicio,
                    attributes: ['nombre'],
                    through: { attributes: ['tipo_pago', 'dia_vencimiento', 'numero_cliente', 'numero_contrato', 'id_servicio'] },
                },
                {
                    model: models.Garantia,
                    attributes: ['tipo', 'numero_escritura'],
                    as: 'garantias',
                    include: [
                        {
                            model: models.Persona,
                            attributes: ['nombre', 'dni', 'celular'],
                            as:'responsable'
                        }
                    ]
                }
    
            ]
        });

        if (!alquiler) {
            return res.status(404).json({ errors: 'Alquiler no encontrado.' });
        }
  
        // armar y emprolijar el JSON
        const JSONAlquiler = alquiler.toJSON();

        //cambiar nombre de campo inquilino
        JSONAlquiler.inquilino = JSONAlquiler.persona;
        delete JSONAlquiler.persona;

        //cambiar nombre propietarios        
        JSONAlquiler.inmueble.propietarios = JSONAlquiler.inmueble.Personas || [];
        delete JSONAlquiler.inmueble.Personas;

        //concatenar datos direccion
        JSONAlquiler.inmueble.resumen_direccion = `${JSONAlquiler.inmueble.direccion.calle}, ${JSONAlquiler.inmueble.direccion.numero}`;
        JSONAlquiler.inmueble.localidad_barrio = `${JSONAlquiler.inmueble.direccion.localidad}, ${JSONAlquiler.inmueble.direccion.barrio}`;

        if(JSONAlquiler.indice_actualizacion === 'Personalizado'){
            JSONAlquiler.fechas_actualizacion = generarFechasActualizacionConCosto(alquiler.fecha_inicio_contrato, 
                alquiler.fecha_fin_contrato, alquiler.precio_inicial, 
                alquiler.periodo_actualizacion, alquiler.porcentaje_actualizacion);

                concatenarMontosActualizacionYMoneda(JSONAlquiler.fechas_actualizacion, alquiler.moneda);
        }

        JSONAlquiler.inmueble.tipo = obtenerTipoInmueble(alquiler.inmueble);

        JSONAlquiler.garantias.forEach((garantia) => {
            //garantia.tipo = obtenerNombreTipoGarantia(garantia.tipo);
            garantia.nombre_tipo_pago = obtenerNombreTipoGarantia(garantia.tipo);
            garantia.resumen_responsable = `${garantia.responsable.nombre} - Tel: ${garantia.responsable.celular}`;
            garantia.dni_responsable = garantia.responsable.dni;
            delete garantia.responsable;
        });
        JSONAlquiler.Servicios.forEach((servicio) => {

            //servicio.gasto_fijo.tipo_pago = obtenerNombreTipoGastoFijo(servicio.gasto_fijo.tipo_pago);
            servicio.gasto_fijo.nombre_tipo_pago = obtenerNombreTipoGastoFijo(servicio.gasto_fijo.tipo_pago);
            servicio.gasto_fijo.nombre = servicio.nombre;
            delete servicio.nombre;
        });

      res.status(200).json(JSONAlquiler);

    } catch (error) {
        console.error('Error al obtener el alquiler por ID:', error);
        res.status(500).json({ errors: 'Error al obtener el alquiler por ID.' });
    }
};

const obtenerInquilinos = async (req, res) => {
    try {
        await sequelize.authenticate();
        const inquilinos = await Alquiler.findAll(
        {
            attributes: ['id_inmueble'],
            include: [{
                model: Persona,
                as: 'persona', // Este alias debe coincidir con la asociación definida
                attributes: ['dni', 'nombre'] // excluir datos de estado
            }]
        });

        const inquilinosSet = new Set();

        inquilinos.forEach(inquilino => {
            inquilinosSet.add(`${inquilino.persona.nombre} - ${inquilino.persona.dni}`)
        })

        const resultado = Array.from(inquilinosSet).map(inquilino => {
            return {
                inquilino: inquilino
            }
        })


        //const resultado = inquilinos.map(alquiler => {
        //    const plainInquilino = alquiler.toJSON();
        //    return {
        //        ...plainInquilino,
        //        inquilino: `${plainInquilino.persona.nombre} - ${plainInquilino.persona.dni}`
        //    };
//
        //});
        return res.json(resultado);
    } catch (error) {
        console.error('Error al obtener los inquilinos:', error);
        // Manejo del error y envío de una respuesta de error al cliente
        return res.status(500).json({ errors: 'Error al obtener los inquilinos.' });
    }
};

const obtenerAlquileresDelInquilino = async (req, res) => {
    const { dni_inquilino } = req.params;
    // Validar que el ID sea un número entero
    if (!Number.isInteger(Number(dni_inquilino))) {
        return res.status(400).json({ errors: 'El DNI debe ser un número entero válido.' });
    }
    try {
        const inquilino = await Persona.findByPk(dni_inquilino);
        if (!inquilino){
            t.rollback();
            return res.status(404).json({ errors: 'No existe un inquilino con ese DNI.' });
        }
        // Utilizar Sequelize para buscar el alquiler por ID   
        const alquileres = await Alquiler.findAll({
            attributes: ['id'],
            where:{
                dni_inquilino:{
                    [Op.eq]: dni_inquilino
                },
            },
            include: [
                {
                    model: models.Estado,
                    attributes: ['nombre'],
                    as: 'estado'
                },
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
                            attributes: ['numero', 'calle', 'barrio', 'localidad', 'provincia'],
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
                }
            ]
        });
        if (!alquileres) {
            return res.status(404).json({ errors: 'Alquiler no encontrado.' });
        }
        // determinar el tipo de cada inmueble y agregar personNames
        const resultado = alquileres.map(alquiler => {
                // armar y emprolijar el JSON
            const JSONAlquiler = alquiler.toJSON();
            //cambiar nombre de campo inquilino
            JSONAlquiler.inquilino = JSONAlquiler.persona;
            delete JSONAlquiler.persona;
            const personas = alquiler.inmueble.Personas || [];
            const personNames = personas.map(persona => `${persona.nombre} - ${persona.dni}`).join(', ');
            delete JSONAlquiler.inmueble.Personas;
            //concatenar datos direccion
            JSONAlquiler.inmueble.resumen_direccion = `${JSONAlquiler.inmueble.direccion.calle}, ${JSONAlquiler.inmueble.direccion.numero}`;
            JSONAlquiler.inmueble.localidad_barrio = `${JSONAlquiler.inmueble.direccion.barrio}, ${JSONAlquiler.inmueble.direccion.localidad}`;
            JSONAlquiler.inmueble.tipo = obtenerTipoInmueble(alquiler.inmueble);
            let descri = `${JSONAlquiler.id} - ${JSONAlquiler.inmueble.resumen_direccion}, ${JSONAlquiler.inmueble.localidad_barrio} - ${personNames} - ${JSONAlquiler.estado.nombre}` 
            return {
                ...JSONAlquiler,
                descri: descri
            };
        });
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error al obtener el alquiler por ID:', error);
        res.status(500).json({ errors: 'Error al obtener el alquiler por ID.' });
    }
}

const obtenerPropietarios = async (req, res) => {
    try{
        const propietarios = await Persona.findAll({
            attributes: ['dni', 'nombre'],
            include: {
                model: Alquiler,
                attributes: ['id'],
                as: 'alquileres',
                required: true
            }
        });

        const resultado = await Promise.all(propietarios.map(async (propietario) => {
            const JSONPropietario = propietario.toJSON();

            JSONPropietario.nombre_dni = `${propietario.nombre} - ${propietario.dni}`;
            delete JSONPropietario.alquileres;
            
            return {
                JSONPropietario
            };
        }));

        res.status(200).json(resultado);
    }
    catch(error){
        console.error('Error al obtener los propietarios:', error);
        res.status(500).json({ errors: 'Error al obtener los los propietarios.' });
    }
}

const copiarAlquilerNuevoPropietario = async (id_alquiler, dni_nuevo_propietario, fecha_cambio, t) => {
    
    if (!Number.isInteger(Number(id_alquiler))) {
        //return res.status(400).json({ errors: 'El ID de alquiler debe ser un número entero válido.' });
        return {error: 'El ID de alquiler debe ser un número entero válido.'};
    }

    if (!Number.isInteger(Number(dni_nuevo_propietario))) {
        //return res.status(400).json({ errors: 'El dni de nuevo propietario debe ser un número entero válido.' });
        return {error: 'El dni de nuevo propietario debe ser un número entero válido.'};
    }

    try {
        const validacionComprador = await PersonaController.validarPersona(dni_nuevo_propietario);
        if (!validacionComprador.valid) {
            //return res.status(400).json({ errors: validacionComprador.message.concat(' (Comprador)') });
            return {error: validacionComprador.message.concat(' (Comprador)')};
        }
     
        const alquilerACambiar = await Alquiler.findByPk(id_alquiler, {
            include: [
                {
                    model: models.Estado,
                    attributes: ['nombre'],
                    as: 'estado'
                },
                {
                    model: models.Inmueble,
                    attributes: ['id', 'id_estado'],
                    as: 'inmueble',
                },
                {
                    model: models.Persona,
                    attributes: ['dni', 'nombre'],
                    as: 'persona'
                },
                {
                    model: models.Moneda,
                    attributes: ['descripcion', 'nombre'],
                    as: 'moneda'
                },
                {
                    model: models.FormaDePago,
                    attributes: ['nombre'],
                    as: 'forma_de_pago'
                },
                {
                    model: models.Servicio,
                    attributes: ['id'],
                    through: { attributes: ['tipo_pago', 'dia_vencimiento', 'numero_cliente', 'numero_contrato'] },
                },
                {
                    model: models.Garantia,
                    attributes: ['tipo', 'numero_escritura', 'dni_responsable'],
                    as: 'garantias',
                    include: [
                        {
                            model: models.Persona,
                            attributes: ['nombre', 'dni', 'celular'],
                            as:'responsable'
                        }
                    ]
                }
    
            ]
        });

        if (!alquilerACambiar) {
            //return res.status(400).json({ errors: 'No existe el alquiler' });
            return {error: 'No existe el alquiler a copiar.'};
        }

        const nuevo_alquiler = construirAlquiler(alquilerACambiar);

        const fecha_actual = new Date().toISOString().split('T')[0];

        // actualizar propietario principal y fecha inicio
        nuevo_alquiler.dni_propietario_principal = dni_nuevo_propietario;
        nuevo_alquiler.fecha_inicio_contrato = fecha_cambio;
        nuevo_alquiler.fecha_registro = fecha_actual;
        nuevo_alquiler.id_estado = alquilerACambiar.id_estado;
        nuevo_alquiler.permite_venta = alquilerACambiar.permite_venta;

        const alquiler = await Alquiler.create(nuevo_alquiler, { transaction: t });

        // Armar y validar Gastos Fijos
        const gastos_fijos = construirCopiaGastosFijos(alquilerACambiar.Servicios, alquiler.id);
        for (const gasto_fijo of gastos_fijos) {
            convertirVaciosAUndefined(gasto_fijo);
            await GastoFijo.create(gasto_fijo, { transaction: t });
        }

        // Armar y validar Garantias
        const garantias = construirGarantias(alquilerACambiar.garantias, alquiler.id);
        for (const garantia of garantias) {
            convertirVaciosAUndefined(garantia);
            await Garantia.create(garantia, { transaction: t });
        }

        // cancelar el alquiler anterior
        const fecha_cancelacion_contrato = fecha_actual;
        await alquilerACambiar.update(
            {
                id_estado: await EstadoController.obtenerIdEstadoPorParametro('Cancelado', 'Alquiler'),
                fecha_cancelacion_contrato
            },
            { transaction: t }
        );

        console.log('Copia de alquiler exitosa.');
        return { success: true };

    } catch (error) {
        console.error('Error al copiar el alquiler por ID:', error);
        //res.status(500).json({ errors: 'Error al obtener el alquiler por ID.' });
        return {error: 'Error al copiar el alquiler'};
    }
}

module.exports = {
    getAlquileres,
    obtenerDetalleAlquiler,
    modificarAlquiler,
    registrarAlquiler,
    cancelarAlquiler,
    obtenerDatosAlquiler,
    obtenerInquilinos,
    obtenerAlquileresDelInquilino,
    concatenarMontosActualizacionYMoneda,
    generarFechasActualizacionConCosto,
    generarFechasActualizacion,
    obtenerNombreTipoGastoFijo,
    obtenerPropietarios,
    copiarAlquilerNuevoPropietario
};