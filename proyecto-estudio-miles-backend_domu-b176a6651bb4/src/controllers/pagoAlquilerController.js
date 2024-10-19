const sequelize = require('../../config/connection'); 
const Alquiler = require('../models/alquiler');
const Direccion = require('../models/direccion');
const Estado = require('../models/estado');
const FormaDePago = require('../models/forma_de_pago');
const Inmueble = require('../models/inmueble');
const Moneda = require('../models/moneda');
const Persona = require('../models/persona');
const PagoAlquiler = require('../models/pago_alquiler');
const DetallePagoServicio = require('../models/detalle_pago_servicio');
const GastoExtra = require('../models/gasto_extra');
const PagoParcial = require('../models/pago_parcial');
const LiquidacionPropietario = require('../models/liquidacion_propietario');
const { models } = require('../models/index');
const { Op } = require("sequelize");
const { obtenerTipoInmueble, convertirDateADateOnly, convertirVaciosAUndefined, convertirFechaAIso, verificarCambios } = require('../utilities/functions');
const { RegistrarDevengarSchema } = require('../validators/pagoAlquilerValidator');
const { RegistrarDetallePagoServicioSchema } = require('../validators/detallePagoServicioValidator');
const { RegistrarGastoExtraSchema, RegistrarGastoPagoSchema, RegistrarGastoNuevoPagoSchema } = require('../validators/gastoExtraValidator');
const { RegistrarPagoParcial, RegistrarCompletarPagoParcial } = require('../validators/pagoParcialValidator')
const AlquilerController = require('./alquilerController');
const EstadoController = require('./estadoController');
const GastoFijo = require('../models/gasto_fijo');
const Servicio = require('../models/servicio');
const Saldo = require('../models/saldo');

const concatenarMontoYMoneda = (monto, moneda) => {
    return `${moneda.descripcion} (${moneda.nombre}) ${monto}`;
}

const construirDevengar = (data) => {
    const { id_alquiler, mes_correspondiente, precio_alquiler, observacion } = data;
    return { id_alquiler, mes_correspondiente, precio_alquiler, observacion }
}

const construirGastosFijosServicio = (data, id_alquiler, id_pago_alquiler) => {
    const nuevos_gastos_fijos_servicio = [];
    data.forEach((gasto_fijo) => {
        nuevos_gastos_fijos_servicio.push({id_pago_alquiler: id_pago_alquiler, 
            id_alquiler: id_alquiler, id_servicio: gasto_fijo.id, monto: gasto_fijo.monto});
    });
    return nuevos_gastos_fijos_servicio;
}

const construirGastosExtra = (data, id_pago_alquiler) => {
    const nuevos_gastos_extra = [];
    data.forEach((gasto_extra) => {
        nuevos_gastos_extra.push({id_pago_alquiler: id_pago_alquiler, 
            descripcion: gasto_extra.descripcion, monto: gasto_extra.monto, quien_pago: gasto_extra.quien_pago,
            a_quien_cobrar: gasto_extra.a_quien_cobrar});
    });
    return nuevos_gastos_extra;
}

const construirPagoParcial = (data) => {
    const {  id_pago_alquiler, id_forma_de_pago, quien_paga, monto, fecha_pago, monto_mora } = data;
    return { id_pago_alquiler, id_forma_de_pago, quien_paga, monto, fecha_pago, monto_mora}
}

const construirDetalleGastosFijos = (data) =>{
    const gastos_fijos = [];
    data.forEach((gasto) => {
        gastos_fijos.push({id: gasto.id, tipo: gasto.tipo, monto: gasto.monto, 
            paga: gasto.paga, nombre: gasto.nombre, id_alquiler: null});
    });
    return gastos_fijos;
}

const construirDetalleGastosFijosModificar = (data) =>{
    const gastos_fijos = [];
    data.forEach((gasto) => {
        gastos_fijos.push({id: gasto.id,nombre: gasto.nombre, monto: gasto.monto});
    });
    return gastos_fijos;
}

const construirDetalleGastosExtra = (data) =>{
    const nuevos_gastos_extra = [];
    data.forEach((gasto_extra) => {
        nuevos_gastos_extra.push({id: gasto_extra.id, 
            monto: gasto_extra.monto, quien_pago: gasto_extra.quien_pago,
            a_quien_cobrar: gasto_extra.a_quien_cobrar, descripcion: gasto_extra.descripcion});
    });
    return nuevos_gastos_extra;
}

const calcularTotalAPagar = (pago, moneda) => {
    let totalAPagar = pago.precio_alquiler;

    pago.detalles_servicios.forEach(detalle_servicio => {
        totalAPagar += detalle_servicio.monto;
    });

    pago.gastos_extra.forEach(gasto_extra => {
        if(gasto_extra.quien_pago == 2 && gasto_extra.a_quien_cobrar == 1) totalAPagar -= gasto_extra.monto;
        else if(gasto_extra.a_quien_cobrar == 2) totalAPagar += gasto_extra.monto;
    });
    let moraPagado = 0;
    pago.pagos_parciales.forEach(parcial => {
        moraPagado += parcial.monto_mora;
    })
    totalAPagar += moraPagado;

    return `${moneda.descripcion} (${moneda.nombre}) ${totalAPagar}`;
};

const calcularTotalAPagarGastosFijos = (pago, moneda) => {
    let totalAPagar = 0;

    pago.detalles_servicios.forEach(detalle_servicio => {
        totalAPagar += detalle_servicio.monto;
    });

    return `${moneda.descripcion} (${moneda.nombre}) ${totalAPagar}`;
};

const calcularTotalAPagarGastosExtra = (pago, moneda) => {
    let totalAPagar = 0;

    pago.gastos_extra.forEach(gasto_extra => {
        if(gasto_extra.quien_pago == 2 && gasto_extra.a_quien_cobrar == 1) totalAPagar -= gasto_extra.monto;
        else if(gasto_extra.a_quien_cobrar == 2) totalAPagar += gasto_extra.monto;
    });

    return `${moneda.descripcion} (${moneda.nombre}) ${totalAPagar}`;
};

const calcularTotalPagado = (pago, moneda) => {
    let totalAPagar = pago.precio_alquiler;
    pago.detalles_servicios.forEach(detalle_servicio => {
        if (detalle_servicio.id_pago_parcial != null)
            totalAPagar += detalle_servicio.monto;
    });
    pago.gastos_extra.forEach(gasto_extra => {
        if (gasto_extra.id_pago_parcial != null){
            if(gasto_extra.quien_pago == 2 && gasto_extra.a_quien_cobrar == 1) totalAPagar -= gasto_extra.monto;
            else if(gasto_extra.a_quien_cobrar == 2) totalAPagar += gasto_extra.monto;
        }
        
    });
    let moraPagado = 0;
    pago.pagos_parciales.forEach(parcial => {
        moraPagado += parcial.monto_mora;
    })
    totalAPagar += moraPagado;
    
    return `${moneda.descripcion} (${moneda.nombre}) ${totalAPagar}`;
}

const calcularTotalPagadoNumerico = (pago, moneda) => {
    let totalPagado = 0;

    if(pago.pagos_parciales){
        pago.pagos_parciales.forEach(pago_parcial => {
            totalPagado += pago_parcial.monto
        })
    }

    return totalPagado;
}

const buscarMayorFecha = (pago) => {

    if (!pago.pagos_parciales || pago.pagos_parciales.length === 0) {
        return null;
    }

    let mayorFecha = pago.pagos_parciales[0].fecha_pago;

    if(mayorFecha){
        pago.pagos_parciales.forEach(pago_parcial => {
            if(pago_parcial.fecha_pago >= mayorFecha) mayorFecha = pago_parcial.fecha_pago;
        });
    }

    return mayorFecha;
};

const buscarPagoActual = (pagos) => {
    let pagoActual = pagos[0];

    pagos.forEach(pago => {
        if(pago.fecha >= pagoActual.fecha) pagoActual = pago; 
    });

    return pagoActual;
};

const obtenerSaldoActual = (pagos) => {
    const pagoActual =  buscarPagoActual(pagos)
    const saldo_actual = pagoActual? pagoActual.saldo_a_la_fecha: 0;
    const origen_saldo_actual = pagoActual? pagoActual.origen_saldo: '';
    return {saldo_actual, origen_saldo_actual}
}

const obtenerNombreRol = (tipo) => {
    if (tipo == 0) {
        return 'Inmobiliaria';
    } else if (tipo == 1) {
        return 'Propietario';
    } else if (tipo == 2) {
        return 'Inquilino';
    } else {
        return '';
    }
};

const getPagosAlquiler = async (req, res) => {
    try{
        const { id } = req.params;
  
        // Validar que el ID sea un número entero
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ errors: 'El ID debe ser un número entero válido.' });
        }

        const alquiler = await Alquiler.findByPk(id, {
            attributes: ['id', 'numero_carpeta', 'fecha_fin_contrato'],
            include:[
                {
                    model: Estado,
                    attributes: ['nombre'],
                    as: 'estado'
                },
                {
                    model: Inmueble,
                    attributes: ['id', 'codigo'],
                    as: 'inmueble',
                    include:[
                        {
                            model: Persona,
                            attributes: ['dni', 'nombre'],
                            through: { attributes: [] },
                            as: 'Personas'
                        },
                        {
                            model: Direccion,
                            attributes: ['numero', 'calle', 'barrio', 'localidad', 'provincia'],
                            as: 'direccion'
                        }
                    ]
                },
                {
                    model: Persona,
                    attributes: ['dni', 'nombre'],
                    as: 'persona'
                },
                {
                    model: Moneda,
                    attributes: ['descripcion', 'nombre'],
                    as: 'moneda'
                },
                {
                    model: FormaDePago,
                    attributes: ['nombre'],
                    as: 'forma_de_pago'
                },
                {
                    model: PagoAlquiler,
                    attributes: ['id', 'mes_correspondiente', 'precio_alquiler', 'monto_mora'],
                    as: 'pagos',
                    include: [
                        {
                            model: DetallePagoServicio,
                            as: 'detalles_servicios'
                        },
                        {
                            model: GastoExtra,
                            attributes: ['monto', 'quien_pago', 'a_quien_cobrar', 'id_pago_parcial'],
                            as: 'gastos_extra'
                        },
                        {
                            model: PagoParcial,
                            attributes: ['monto', 'paga_inquilino', 'fecha_pago', 'monto_mora'],
                            as: 'pagos_parciales'
                        },
                        {
                            model: LiquidacionPropietario,
                            attributes: ['id']
                        },
                        {
                            model: Estado,
                            attributes: ['nombre'],
                            as: 'estado'
                        },
                        
                    ]
                }
            ]

        });

        if (!alquiler) {
            return res.status(404).json({ errors: 'Alquiler no encontrado.' });
        }

        // ordenar y completar datos de alquiler
        let orden = 1;
        alquiler.pagos.forEach(pago => {
            pago.setDataValue('orden', orden); // Agregar el campo 'orden'
            orden++;
        });
        const JSONAlquilerPagos = alquiler.toJSON();
        //cambiar nombre de campo inquilino
        JSONAlquilerPagos.inquilino = JSONAlquilerPagos.persona;
        delete JSONAlquilerPagos.persona;
    
        //cambiar nombre propietarios
        JSONAlquilerPagos.inmueble.propietarios = JSONAlquilerPagos.inmueble.Personas || [];
        delete JSONAlquilerPagos.inmueble.Personas;

        //concatenar datos direccion
        JSONAlquilerPagos.inmueble.resumen_direccion = `${JSONAlquilerPagos.inmueble.direccion.calle} ${JSONAlquilerPagos.inmueble.direccion.numero} - ${JSONAlquilerPagos.inmueble.direccion.barrio}, ${JSONAlquilerPagos.inmueble.direccion.localidad}`;       
        delete JSONAlquilerPagos.inmueble.direccion;

        // calcular totalAPagar de todos los pagos y setear estado liquidado
        await Promise.all(JSONAlquilerPagos.pagos.map(async (pago) => {
            pago.totalAPagar = calcularTotalAPagar(pago, JSONAlquilerPagos.moneda);
            pago.totalPagado = calcularTotalPagado(pago, JSONAlquilerPagos.moneda);
            pago.liquidado = pago.liquidacion_propietarios.length > 0 ? true : false;
            pago.fecha = buscarMayorFecha(pago);
            let disponibleModificar = false;
            const promises = pago.detalles_servicios.map(async (servicio) => {
                if (servicio.id_pago_parcial == null) {
                    const gastoFijo = await GastoFijo.findOne({
                        where: {
                            id_alquiler: servicio.id_alquiler,
                            id_servicio: servicio.id_servicio,
                        }
                    });
                    if (gastoFijo && gastoFijo.tipo_pago < 2) {
                        disponibleModificar = true;
                    }
                }
            });
        
            // Esperar a que todas las promesas de servicios se resuelvan
            await Promise.all(promises);
            pago.disponibleModificar = disponibleModificar;
        }));

        // buscar saldo actual
        //const { saldo_actual, origen_saldo_actual } = obtenerSaldoActual(JSONAlquilerPagos.pagos);
        //JSONAlquilerPagos.saldo_actual = saldo_actual;
        //JSONAlquilerPagos.origen_saldo_actual = origen_saldo_actual;
        const saldo = await obtenerSaldoActualNuevo(alquiler.id);
        JSONAlquilerPagos.saldo_actual = saldo.montoSaldo //concatenarMontoYMoneda(saldo.montoSaldo, JSONAlquilerPagos.moneda);
        JSONAlquilerPagos.origen_saldo_actual = saldo.origen;
        JSONAlquilerPagos.descripcion_saldo = saldo.descripcionSaldo;
        const saldoSel = await Saldo.findByPk(saldo.id);
        let fechaOrigenSaldo = 'No existe un saldo';
        if (saldoSel){
            if (saldoSel.id_pago_parcial_cubierto != null){
                const pagoCierre = await PagoParcial.findOne({
                    attributes: ['fecha_pago'],
                    where:{
                        id: saldoSel.id_pago_parcial_cubierto
                    }
                })
                fechaOrigenSaldo = pagoCierre.fecha_pago
            }
            else{
                const pagoOrigen = await PagoParcial.findOne({
                    attributes: ['fecha_pago'],
                    where:{
                        id: saldoSel.id_pago_parcial_origen
                    }
                })
                fechaOrigenSaldo = pagoOrigen.fecha_pago
            }
        }
        JSONAlquilerPagos.fecha_saldo = fechaOrigenSaldo;
        res.status(200).json(JSONAlquilerPagos);

    }
    catch(error){
        console.error('Error al obtener los pagos del alquiler por ID:', error);
        res.status(500).json({ errors: 'Error al obtener los pagos del alquiler por ID.' });
    }

}
const obtenerDatosDevengar = async (req, res) => {
    const { id } = req.params;
    // Validar que el ID sea un número entero
    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({ errors: 'El ID del Alquiler debe ser un número entero válido.' });
    }
    try {
        const alquiler = await models.Alquiler.findByPk(id, {
            include: [
                {
                    model: models.Estado,
                    attributes: ['nombre'],
                    as: 'estado'
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
                    model: PagoAlquiler,
                    attributes: ['id', 'mes_correspondiente', 'precio_alquiler', 'monto_mora'],
                    as: 'pagos',
                    include: [
                        {
                            model: DetallePagoServicio,
                            attributes: ['monto'],
                            as: 'detalles_servicios'
                        },
                        {
                            model: GastoExtra,
                            attributes: ['monto', 'quien_pago', 'a_quien_cobrar'],
                            as: 'gastos_extra'
                        },
                        {
                            model: PagoParcial,
                            attributes: ['monto', 'paga_inquilino', 'fecha_pago'],
                            as: 'pagos_parciales'
                        },
                        {
                            model: LiquidacionPropietario,
                            attributes: ['id']
                        },
                        {
                            model: Estado,
                            attributes: ['nombre'],
                            as: 'estado'
                        },
                        
                    ]
                },
                {
                    model: models.Servicio,
                    attributes: ['nombre', 'id'],
                    through: { attributes: ['tipo_pago', 'dia_vencimiento', 'numero_cliente', 'numero_contrato'] },
                }
            ]
        });
        if (!alquiler) {
            return res.status(404).json({ errors: 'Alquiler no encontrado.' });
        }
        const fechaInicio = alquiler.fecha_inicio_contrato;
        const fechaFin = alquiler.fecha_fin_contrato;
        const fechaCancelado = alquiler.fecha_cancelacion_contrato;
        const JSONAlquiler = alquiler.toJSON();
        const saldoActual = await obtenerSaldoActualNuevo(alquiler.id);
        JSONAlquiler.origen_saldo_actual = saldoActual.origen;
        JSONAlquiler.descripcion_saldo = saldoActual.descripcionSaldo;
        JSONAlquiler.saldo_actual = saldoActual.montoSaldo;
        if (JSONAlquiler.estado.nombre == 'Por Iniciar')
            JSONAlquiler.mesesCorrespondientes = []
        else if (JSONAlquiler.estado.nombre == 'Cancelado')    
            JSONAlquiler.mesesCorrespondientes = await obtenerFechasPendientesDevengar(fechaInicio, fechaCancelado, id);
        else if (JSONAlquiler.estado.nombre == 'Vigente' || JSONAlquiler.estado.nombre == 'Finalizado' || JSONAlquiler.estado.nombre == 'Finalizado pendiente de pagos')
            JSONAlquiler.mesesCorrespondientes = await obtenerFechasPendientesDevengar(fechaInicio, fechaFin, id);
        else
            JSONAlquiler.mesesCorrespondientes = [];
        if(JSONAlquiler.indice_actualizacion === 'Personalizado'){
            JSONAlquiler.fechas_actualizacion = AlquilerController.generarFechasActualizacionConCosto(alquiler.fecha_inicio_contrato, 
                alquiler.fecha_fin_contrato, alquiler.precio_inicial, 
                alquiler.periodo_actualizacion, alquiler.porcentaje_actualizacion);

                AlquilerController.concatenarMontosActualizacionYMoneda(JSONAlquiler.fechas_actualizacion, alquiler.moneda);
        }
        else
        {
            JSONAlquiler.fechas_actualizacion = AlquilerController.generarFechasActualizacion(alquiler.fecha_inicio_contrato, 
                alquiler.fecha_fin_contrato, alquiler.periodo_actualizacion)
        }
        JSONAlquiler.Servicios.forEach((servicio) => {
            servicio.nombre_tipo_pago = AlquilerController.obtenerNombreTipoGastoFijo(servicio.gasto_fijo.tipo_pago);
            servicio.tipo_pago = servicio.gasto_fijo.tipo_pago;
            servicio.dia_vencimiento = servicio.gasto_fijo.dia_vencimiento;
            servicio.numero_cliente = servicio.gasto_fijo.numero_cliente;
            servicio.numero_contrato = servicio.gasto_fijo.numero_contrato;
            servicio.disponible = (servicio.gasto_fijo.tipo_pago == 2 ? false : true);
            servicio.monto = 0;
            delete servicio.gasto_fijo;
        });
        JSONAlquiler.pagos.forEach(pago => {
            pago.totalAPagar = calcularTotalAPagar(pago, JSONAlquiler.moneda);
            pago.totalPagado = calcularTotalPagado(pago, JSONAlquiler.moneda);
            pago.liquidado = pago.liquidacion ? true : false;
            pago.fecha = buscarMayorFecha(pago);
        });
        res.status(200).json(JSONAlquiler);
    } catch (error) {
        console.error('Error al obtener el alquiler por ID:', error);
        res.status(500).json({ errors: 'Error al obtener el alquiler por ID.' });
    }
}

const obtenerPrecioAlquiler = async (req, res) => {
    const { id, mes } = req.body;
    // Validar que el ID sea un número entero
    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({ errors: 'El ID del Alquiler debe ser un número entero válido.' });
    }
    try{
        const alquiler = await Alquiler.findByPk(id);
        if (!alquiler){
            await t.rollback();
            return res.status(400).json({ errors: 'No existe un Alquiler con esa clave.'});
        }
        const mesesDisponibles = generarMesesPosibles(alquiler.fecha_inicio_contrato, alquiler.fecha_fin_contrato);
        if (!mesesDisponibles.includes(mes)) {
            t.rollback();
            return res.status(404).json({ errors: 'El período seleccionado no es disponible.' });    
        }
        let fechasActualizacion = [];
        const posicionMes = mesesDisponibles.indexOf(mes);
        if(alquiler.indice_actualizacion === 'Personalizado'){
            fechasActualizacion = AlquilerController.generarFechasActualizacionConCosto(alquiler.fecha_inicio_contrato, 
                alquiler.fecha_fin_contrato, alquiler.precio_inicial, 
                alquiler.periodo_actualizacion, alquiler.porcentaje_actualizacion);
        }
        else
        {
            fechasActualizacion = AlquilerController.generarFechasActualizacion(alquiler.fecha_inicio_contrato, 
                alquiler.fecha_fin_contrato, alquiler.periodo_actualizacion)
        }
        let periodosActualizacion = [];
        let montosActualizacion = [alquiler.precio_inicial];
        fechasActualizacion.forEach(fechaAct => {
            let [startYear, startMonth] = fechaAct.fecha.split('-').map(Number);
            // Formatear el mes y el año como 'MM-YYYY'
            const mes = startMonth.toString().padStart(2, '0'); // Mes con dos dígitos
            periodosActualizacion.push(`${mes}-${startYear}`);
            // Avanzar al siguiente mes
            startMonth++;
            montosActualizacion.push(fechaAct.monto);
        });
        let posicionPeriodo = 0;
        periodosActualizacion.forEach(actualizacion => {
            let posicionPeriodoActualizacion = mesesDisponibles.indexOf(actualizacion);
            if (posicionMes >= posicionPeriodoActualizacion)
                posicionPeriodo++;
        });
        const resultado = {
            fechas: fechasActualizacion,
            monto: montosActualizacion[posicionPeriodo]
        }
        res.status(200).json(resultado);
    } catch (error) {  
        t.rollback();      
        res.status(500).json({ errors: 'Error al obtener el precio del Alquiler.' });
    }
}

const obtenerFechasPendientesDevengar = async (fechaInicio, fechaFin, id) => {
    const mesesCorrespondientes = generarMesesPosibles(fechaInicio, fechaFin);
    const registroMesesDevengados = await models.PagoAlquiler.findAll({
        attributes: ['mes_correspondiente'],
        where:{
            id_alquiler: id
        }
    })
    const mesesDevengados = [];
    registroMesesDevengados.forEach(mesD => {
        mesesDevengados.push(mesD.mes_correspondiente);
    });
    // Filtrar las fechas para quitar las que están en el array fechasAEliminar
    const mesesFiltrados = mesesCorrespondientes.filter(mes => !mesesDevengados.includes(mes));
    return mesesFiltrados;
}

const generarMesesPosibles = (fechaInicio, fechaFin) => {
    let [startYear, startMonth] = fechaInicio.split('-').map(Number);
    let [endYear, endMonth] = fechaFin.split('-').map(Number);
    // Array para almacenar los meses
    const mesesCorrespondientes = [];
    while (startYear < endYear || (startYear === endYear && startMonth <= endMonth)) {
        // Formatear el mes y el año como 'MM-YYYY'
        const mes = startMonth.toString().padStart(2, '0'); // Mes con dos dígitos
        mesesCorrespondientes.push(`${mes}-${startYear}`);
        // Avanzar al siguiente mes
        startMonth++;
        if (startMonth > 12) {
            startMonth = 1;
            startYear++;
        }
    }
    return mesesCorrespondientes;
}

const devengarAlquiler = async (req, res) =>{
    await sequelize.authenticate();
    const t = await sequelize.transaction();
    try{
        // Convertir campos vacíos a undefined
        convertirVaciosAUndefined(req.body);
        // Extraer datos de alquiler del cuerpo de la solicitud y juntarlos
        const devengar_nuevo = construirDevengar(req.body);
        const pagoMesCorrespondiente = await PagoAlquiler.findOne({
            where:{
                id_alquiler: devengar_nuevo.id_alquiler,
                mes_correspondiente: devengar_nuevo.mes_correspondiente
            }
        });
        if (pagoMesCorrespondiente){
            t.rollback();
            return res.status(400).json({ errors: 'Ya existe un pago para ese período.' });
        }
        devengar_nuevo.id_estado = await EstadoController.obtenerIdEstadoPorParametro('Pendiente de Pago', 'Pago');
        // Validar los datos recibidos usando Joi
        const { error: devengarError, value: devengarValue } = RegistrarDevengarSchema.validate(devengar_nuevo, { abortEarly: false });
        if (devengarError) {
            await t.rollback();
            const errorMessage = devengarError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessage });
        }
        devengarValue.monto_mora = 0;
        devengarValue.saldo_a_la_fecha = 0;
        devengarValue.origen_saldo = "";
        const pagoAlquiler = await PagoAlquiler.create(devengarValue, { transaction: t });
        if (!pagoAlquiler || !pagoAlquiler.id) {
            await t.rollback();
            return res.status(500).json({ errors: 'Error.' });
        }
        const gastos_fijos = construirGastosFijosServicio(req.body.gastos_fijos, devengarValue.id_alquiler, pagoAlquiler.id);
        const erroresGastosFijos = [];
        for (const gasto_fijo of gastos_fijos) {
            convertirVaciosAUndefined(gasto_fijo);
            try {
                const { error: gastoFijoError } = RegistrarDetallePagoServicioSchema.validate(gasto_fijo, { abortEarly: false });
                if (gastoFijoError) {
                    erroresGastosFijos.push(...gastoFijoError.details.map(detail => detail.message));
                } else {
                    await DetallePagoServicio.create(gasto_fijo, { transaction: t });
                }
            } catch (validationError) {
                erroresGastosFijos.push(validationError.message);
            }
        }
        if (erroresGastosFijos.length > 0) {
            await t.rollback();
            return res.status(400).json({ errors: erroresGastosFijos });
        }
        const gastos_extra = construirGastosExtra(req.body.gastos_extra, pagoAlquiler.id);
        const erroresGastosExtras = [];
        for (const gasto_extra of gastos_extra) {
            convertirVaciosAUndefined(gasto_extra);
            try {
                const { error: gastoExtraError } = RegistrarGastoExtraSchema.validate(gasto_extra, { abortEarly: false });
                if (gastoExtraError){
                    erroresGastosExtras.push(...gastoExtraError.details.map(detail => detail.message));
                } else {
                    await GastoExtra.create(gasto_extra, { transaction: t });
                }
            } catch (validationError) {
                erroresGastosExtras.push(validationError.message);
            }
        }
        if (erroresGastosExtras.length > 0) {
            await t.rollback();
            return res.status(400).json({ errors: erroresGastosExtras });
        }      
        await t.commit();
        return res.status(201).json({ message: 'Alquiler Devengado con éxito.' });
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
            return res.status(500).json({ errors: 'Error al devengar el alquiler.' });
        }
    }
}

const obtenerDetallePagoAlquiler = async (req, res) => {
    try{
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ errors: 'El id debe ser un número entero válido.' });
        }

        const pago = await PagoAlquiler.findOne({
            where: { id:id },
            attributes: ['id', 'mes_correspondiente', 'precio_alquiler', 'monto_mora', 'observacion'],
            include: [
                {
                    model: Estado,
                    attributes: ['nombre'],
                    as: 'estado'
                },
                {
                    model: PagoParcial,
                    attributes: ['monto', 'paga_inquilino', 'fecha_pago','monto_mora'],
                    as: 'pagos_parciales',
                    include:[
                        {
                            model: FormaDePago,
                            attributes: ['nombre'],
                            as: 'forma_de_pago'
                        }
                    ]
                },
                {
                    model: Alquiler,
                    attributes: ['id', 'dia_vencimiento_inquilino', 'dia_inicial_mora', 'porcentaje_mora_diaria', 'periodo_actualizacion', 'indice_actualizacion','fecha_cancelacion_contrato'],
                    as: 'alquiler',
                    include:{
                        model: Moneda,
                        attributes: ['nombre', 'descripcion'],
                        as: 'moneda'
                    }
                },
                {
                    model: DetallePagoServicio,
                    as: 'detalles_servicios',
                    include:[
                        {
                            model: PagoParcial,
                            attributes: ['fecha_pago', 'paga_inquilino'],
                            as: 'pago_parcial',
                            include: [{
                                model: FormaDePago,
                                as: 'forma_de_pago'
                            }]
                        }
                    ]
                },
                {
                    model: GastoExtra,
                    attributes: ['descripcion', 'monto', 'quien_pago', 'a_quien_cobrar'],
                    as: 'gastos_extra',
                    include:[
                        {
                            model: PagoParcial,
                            attributes: ['fecha_pago', 'paga_inquilino'],
                            as: 'pago_parcial'
                        }
                    ]
                },
                {
                    model: LiquidacionPropietario,
                    attributes: ['id']
                }
            ]
        })

        if (!pago) {
            return res.status(404).json({ errors: 'Pago no encontrado.' });
        }

        const JSONPago = pago.toJSON();
        const pagoParcialAlquiler = await PagoParcial.findAll({
            where: {
                id_pago_alquiler:id,
            },
            include: [
                {
                    model: FormaDePago,
                    as: 'forma_de_pago'
                }
            ],
            order: [
                ['id', 'ASC']
            ],
            limit: 1
        })
        JSONPago.forma_pago_alquiler = 'Sin pagar';
        if (pagoParcialAlquiler.length > 0)
            JSONPago.forma_pago_alquiler = pagoParcialAlquiler[0].forma_de_pago.nombre;    
        JSONPago.totalAPagar = calcularTotalAPagar(pago, JSONPago.alquiler.moneda);
        JSONPago.totalPagado = calcularTotalPagado(pago, JSONPago.alquiler.moneda);
        JSONPago.liquidado = pago.liquidacion_propietarios.length > 0 ? true : false;
        JSONPago.fecha = buscarMayorFecha(pago);
        //buscar formas de pago
        let formas_de_pago = new Set();;
        JSONPago.pagos_parciales.forEach(pago_parcial => {
            formas_de_pago.add(JSON.stringify(`${pago_parcial.forma_de_pago.nombre}`));
        })
        JSONPago.formas_de_pago = Array.from(formas_de_pago)
        .map(forma => JSON.parse(forma));

        JSONPago.monto_total_fijos = calcularTotalAPagarGastosFijos(JSONPago, JSONPago.alquiler.moneda);
        JSONPago.monto_total_extras = calcularTotalAPagarGastosExtra(JSONPago, JSONPago.alquiler.moneda);

        await Promise.all(JSONPago.detalles_servicios.map(async (servicio) => {
            const gastoFijo = await GastoFijo.findOne({
                where: {
                    id_alquiler: servicio.id_alquiler,
                    id_servicio: servicio.id_servicio,
                },
                include: [{
                    model: Servicio,
                    as: 'servicio'
                }]
            });
            if (gastoFijo){
                if (servicio.pago_parcial != null)
                    servicio.pago_parcial.paga_inquilino = (servicio.pago_parcial.paga_inquilino? 'Inquilino' : 'Inmobiliaria');
                servicio.tipo_pago = gastoFijo.tipo_pago;
                servicio.gasto_fijo = {
                    tipo_pago : AlquilerController.obtenerNombreTipoGastoFijo(gastoFijo.tipo_pago),
                    dia_vencimiento : gastoFijo.dia_vencimiento,
                    numero_cliente : gastoFijo.numero_cliente,
                    numero_contrato : gastoFijo.numero_contrato,
                    servicio : {
                        nombre: gastoFijo.servicio.nombre  
                    } 
                }
                servicio.disponible = (gastoFijo.tipo_pago == 2 ? false : true);
                servicio.pagado = false;
                
            }
        }));
        
        JSONPago.gastos_extra.forEach(gasto => {
            gasto.quien_pago = obtenerNombreRol(gasto.quien_pago);
            gasto.a_quien_cobrar = obtenerNombreRol(gasto.a_quien_cobrar);
        })

        JSONPago.precio_alquiler = concatenarMontoYMoneda(JSONPago.precio_alquiler, JSONPago.alquiler.moneda);
        
        JSONPago.proxima_actualizacion = "A Calcular"
        JSONPago.monto_actualizacion = "A Calcular"
        /*
        const saldo = await obtenerSaldoDeUnPago(JSONPago.id);
        JSONPago.saldo_a_la_fecha = concatenarMontoYMoneda(saldo.montoSaldo, JSONPago.alquiler.moneda);
        JSONPago.origen_saldo = saldo.origen;
        JSONPago.descripcion_saldo = saldo.descripcionSaldo;
        */
        delete JSONPago.liquidacion_propietarios;
        const alquiler = await Alquiler.findByPk(pago.alquiler.id, {
            attributes: ['id'],
            include:[
                {
                    model: PagoAlquiler,
                    attributes: ['id'],
                    as: 'pagos'
                }
            ]
        });
        let listaIdPagos = [];
        alquiler.pagos.forEach(pago => {
            listaIdPagos.push(pago.id);
        })
        JSONPago.orden = listaIdPagos.indexOf(pago.id) + 1;
        
        const pago_mora = await PagoParcial.findOne({
            attributes: ['monto_mora'],
            where: {
                id_pago_alquiler: id,
                monto_mora: {
                    [Op.gt] : 0
                }
            }
        })
        JSONPago.monto_mora = concatenarMontoYMoneda((!pago_mora ? 0 : pago_mora.monto_mora), JSONPago.alquiler.moneda);
        
        return res.status(200).json(JSONPago);
    }
    catch(error){
        console.error(error);
        return res.status(500).json({ message: 'Error al obtener el pago' });
    }
}

// Función independiente para manejar los saldos fuera de la transacción principal
const actualizarSaldo = async (data) => {
    try {
        // Actualizar el saldo si es necesario
        if (data.saldoActual != -1) {
            await Saldo.update({ id_pago_parcial_cubierto: data.pagoParcial },  
                               { where: { id: data.saldoActual } });
        }

        // Crear un saldo a favor si el monto es mayor al mínimo
        if (data.pago_nuevo > data.montoMinimo) {
            const saldoFavorInquilino = {
                id_pago_parcial_origen: data.pagoParcial,
                id_pago_parcial_cubierto: null,
                monto: data.pago_nuevo - data.montoMinimo,
                quien_pago: data.quien_paga,
                descripcion: data.descripcion
            };
            await Saldo.create(saldoFavorInquilino);
        }
    } catch (error) {
        // Manejar errores en la actualización de saldo
        console.error('Error al actualizar los saldos:', error);
    }
};

const registrarPagoAlquiler = async (req, res) => {
    await sequelize.authenticate();
    const t = await sequelize.transaction();
    let idAlquilerOrig = -1;
    try{
        // Convertir campos vacíos a undefined
        convertirVaciosAUndefined(req.body);
        // Extraer datos de alquiler del cuerpo de la solicitud y juntarlos
        const pago_nuevo = construirPagoParcial(req.body);
        pago_nuevo.observacion = '';
        if (!Number.isInteger(Number(pago_nuevo.id_pago_alquiler))) {
            t.rollback();
            return res.status(400).json({ errors: 'Los datos no son validos.' });
        }
        const pagoDevengado = await PagoAlquiler.findOne({
            where: { id:pago_nuevo.id_pago_alquiler },
            attributes: ['id','id_alquiler', 'precio_alquiler'],
            include: 
                [
                    {
                        model: Estado,
                        attributes: ['id','nombre'],
                        as: 'estado'
                    },
                    {
                        model: Alquiler,
                        attributes: ['id', 'dia_vencimiento_inquilino', 'dia_inicial_mora', 'porcentaje_mora_diaria', 'periodo_actualizacion', 'indice_actualizacion'],
                        as: 'alquiler'
                    }
                ]
        })
        if (!pagoDevengado){
            t.rollback();
            return res.status(400).json({ errors: 'No se ha devengado el alquiler para el período elegido.' });
        }
        idAlquilerOrig = pagoDevengado.alquiler.id;
        //Puedo saber si existe con el estado del PagoAlquiler
        const existePagoAlquiler = (pagoDevengado.estado.nombre == 'Pendiente de Pago' ? false : true);
        let monto_alquiler = 0;
        let monto_mora = 0;
        let monto_gastos_fijos = 0;
        let monto_gastos_extras = 0;
        let monto_saldo = 0;
        const saldoActual = await obtenerSaldoActualNuevo(pagoDevengado.alquiler.id);
        const origen_saldo = saldoActual.origen;
        const monto_saldo_pendiente = parseFloat(saldoActual.montoSaldo);
        let solo_paga_inquilino = true;
        if (origen_saldo == 'Error'){
            t.rollback();
            return res.status(400).json({ errors: 'Error con los saldos.' });
        }
        if (origen_saldo != '')
            monto_saldo += (origen_saldo == 'Inquilino' ?  -1 * monto_saldo_pendiente : monto_saldo_pendiente)
        if (existePagoAlquiler == false){
            //Es el primer pago por lo tanto tiene que pagar el alquiler como mínimo.
            monto_alquiler += pagoDevengado.precio_alquiler;
            monto_mora = (typeof pago_nuevo.monto_mora === 'undefined' ? 0 : parseFloat(req.body.monto_mora)) 
        }
        else{
            pago_nuevo.monto_mora = 0;
        }
        const gastosPagos = [];
        const gastos_fijos = construirDetalleGastosFijos(req.body.gastos_fijos);
        if (gastos_fijos.length > 0){
            for (const gasto_fijo of gastos_fijos) {
                if (gasto_fijo.monto < 0){
                    await t.rollback();
                    const errorMessage = `El precio del servicio: ${gasto_fijo.nombre} no es valido.`
                    return res.status(400).json({ errors: errorMessage });
                }
                if (gasto_fijo.paga){
                    if (gasto_fijo.tipo < 2){
                        solo_paga_inquilino = false;
                        if (gasto_fijo.monto == 0){
                            await t.rollback();
                            const errorMessage = `El servicio: ${gasto_fijo.nombre} no puede estar pago y ser 0.`
                            return res.status(400).json({ errors: errorMessage });
                        }
                        if (gasto_fijo.monto > 0)
                            monto_gastos_fijos += gasto_fijo.monto;
                    }
                    gastosPagos.push(gasto_fijo.id);
                }
            }
        }
        const gastos_extra = construirDetalleGastosExtra(req.body.gastos_extra);
        const erroresGastosExtras = [];
        const idGastoExtras = [];
        if (gastos_extra.length > 0){
            for (const gasto_extra of gastos_extra) {
                convertirVaciosAUndefined(gasto_extra);
                try {
                    if (gasto_extra.id != -1){
                        const { error: gastoExtraError } = RegistrarGastoPagoSchema.validate(gasto_extra, { abortEarly: false });
                        if (gastoExtraError)
                            erroresGastosExtras.push(...gastoExtraError.details.map(detail => detail.message));
                        if (gasto_extra.quien_pago < 2 && gasto_extra.a_quien_cobrar == 2)
                            monto_gastos_extras += gasto_extra.monto;
                        if (gasto_extra.quien_pago == 2 && gasto_extra.a_quien_cobrar < 2)
                            monto_gastos_extras -= gasto_extra.monto;
                        gasto_extra.id_pago_parcial = null;
                        idGastoExtras.push(gasto_extra.id);
                    }
                    else {
                        delete gasto_extra.id;
                        gasto_extra.monto = Math.abs(gasto_extra.monto);
                        if (gasto_extra.quien_pago < 2 && gasto_extra.a_quien_cobrar == 2)
                            monto_gastos_extras += gasto_extra.monto;
                        if (gasto_extra.quien_pago == 2 && gasto_extra.a_quien_cobrar < 2)
                            monto_gastos_extras -= gasto_extra.monto;
                        const { error: gastoExtraError } = RegistrarGastoNuevoPagoSchema.validate(gasto_extra, { abortEarly: false });
                        if (gastoExtraError)
                            erroresGastosExtras.push(...gastoExtraError.details.map(detail => detail.message));
                        gasto_extra.id = -1;
                    }
                } catch (validationError) {
                    erroresGastosExtras.push(validationError.message);
                }
            }
        }
        if (erroresGastosExtras.length > 0) {
            await t.rollback();
            return res.status(400).json({ errors: erroresGastosExtras });
        }
        const montoMinimo = monto_alquiler + monto_mora + monto_gastos_extras + monto_gastos_fijos + monto_saldo;
        pago_nuevo.monto = parseFloat(pago_nuevo.monto);
        if (pago_nuevo.monto < montoMinimo){
            await t.rollback();
            return res.status(400).json({ errors: 'El monto ingresado es menor al mínimo.' });
        }
        let pagoParcial = null;

        if (existePagoAlquiler && Object.keys(gastosPagos).length == 0 && Object.keys(gastos_extra).length == 0){
            await t.rollback();
            return res.status(400).json({ errors: 'No se ha seleccionado ningún concepto a pagar.' });
        }

        if (!existePagoAlquiler || gastosPagos.length > 0 || gastos_fijos.length > 0){
            convertirVaciosAUndefined(pago_nuevo);
            if (monto_gastos_extras == 0 && solo_paga_inquilino){
                const { error: pagoError, value: pagoValue } = RegistrarCompletarPagoParcial.validate(pago_nuevo, { abortEarly: false });
                if (pagoError) {
                    await t.rollback();
                    const errorMessages = pagoError.details.map(detail => detail.message);
                    return res.status(400).json({ errors: errorMessages });
                }
                pagoValue.paga_inquilino = true;
                pagoParcial = await PagoParcial.create(pagoValue, { transaction: t });
            }
            else
            {
                const { error: pagoError, value: pagoValue } = RegistrarPagoParcial.validate(pago_nuevo, { abortEarly: false });
                if (pagoError) {
                    await t.rollback();
                    const errorMessages = pagoError.details.map(detail => detail.message);
                    return res.status(400).json({ errors: errorMessages });
                } 
                pagoValue.paga_inquilino = true;
                pagoParcial = await PagoParcial.create(pagoValue, { transaction: t });
            }
        }
        // Actualizar gastos fijos y gastos extras
        let hayCambiosServicios = false;
        try{
            await Promise.all(gastos_fijos.map(async (gasto) => {
                const gastoOrig = await DetallePagoServicio.findOne({ where: { id: gasto.id } });
                if (gastoOrig) {
                    const changesGastoFijo = {};
                    if (gastoOrig.monto !== gasto.monto)
                        changesGastoFijo['monto'] = gasto.monto;
                    if (gastosPagos.includes(gasto.id))
                        changesGastoFijo['id_pago_parcial'] = pagoParcial.id;
                    if (Object.keys(changesGastoFijo).length > 0){
                        hayCambiosServicios = true;
                        await gastoOrig.update(changesGastoFijo, { transaction: t });
                    }       
                }
            }));
            await Promise.all(gastos_extra.map(async (gasto) => {
                if (gasto.id != -1){
                    const gastoOrig = await GastoExtra.findOne({ where: {id: gasto.id }});
                    if (gastoOrig) {
                        await gastoOrig.update({id_pago_parcial: pagoParcial.id}, { transaction: t });
                    }
                }
                else
                {
                    delete gasto.id
                    gasto.id_pago_alquiler = pagoDevengado.id;
                    gasto.id_pago_parcial = pagoParcial.id;
                    GastoExtra.create(gasto, { transaction: t });
                }
                
            }));
        }
        catch(error){
         
            await t.rollback();
            return res.status(400).json({ errors: 'Error al registrar el pago.' });
        }
        
        // Actualizar el estado del pago solo después de todas las operaciones
        let id_nuevo_estado = pagoDevengado.estado.id;
        let resultado = 'Pago completado con éxito. Listo para liquidar.';
        if (gastosPagos.length > 0 || gastos_fijos.length > 0) {
            id_nuevo_estado = gastosPagos.length === gastos_fijos.length
                ? await EstadoController.obtenerIdEstadoPorParametro('Pagado', 'Pago')
                : await EstadoController.obtenerIdEstadoPorParametro('Pagado Parcialmente', 'Pago');
        }
        else
        {
            resultado = (hayCambiosServicios ? 'Pago realizado con éxito.' : 
                        (gastos_fijos.length > 0 ? 'Gastos extra pagado con éxito' : 'No se han registrado cambios.'));
        }
        if (id_nuevo_estado !== pagoDevengado.estado.id)
            await pagoDevengado.update({ id_estado: id_nuevo_estado }, { transaction: t });
    
        await t.commit();
        // Llamamos a la función de actualización de saldo fuera de la transacción principal
        if (pagoParcial != null){
            const datosSaldo = {
                pago_nuevo: pago_nuevo.monto,
                montoMinimo: montoMinimo,
                pagoParcial: pagoParcial.id,
                saldoActual: saldoActual.id,
                descripcion: req.body.observacion,
                quien_paga: false
            }
            await actualizarSaldo(datosSaldo);
        }
        if (idAlquilerOrig != -1){
            const alquilerOrig = await Alquiler.findByPk(idAlquilerOrig);
            const id_estado_finalizado_pagos_pendientes = await EstadoController.obtenerIdEstadoPorParametro('Finalizado pendiente de pagos', 'Alquiler');
            const id_estado_finalizado = await EstadoController.obtenerIdEstadoPorParametro('Finalizado', 'Alquiler');
            if (alquilerOrig.id_estado == id_estado_finalizado_pagos_pendientes){
                const poseeDeuda = await poseePagosPendientes(alquilerOrig.id);
                if (!poseeDeuda){
                    const updateAlquiler = {
                        id_estado: id_estado_finalizado
                    }
                    await alquilerOrig.update(updateAlquiler);
                }
            }
        }
        return res.status(201).json({ message: resultado });
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
            await t.rollback();
            return res.status(500).json({ errors: 'Error al devengar el alquiler.' });
        }
    }
}

const obtenerDatosRegistrarPago = async (req, res) =>{
    const { id } = req.params;
    // Validar que el ID sea un número entero
    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({ errors: 'El ID del Pago debe ser un número entero válido.' });
    }
    try {
        const pago = await models.PagoAlquiler.findByPk(id, {
            include: [    
                {
                model: DetallePagoServicio,
                    attributes: { 
                        exclude: ['id_pago_parcial', 'id_pago_alquiler'] 
                    },
                    as: 'detalles_servicios',
                    required: false,
                    where:{
                        id_pago_parcial: {
                            [Op.is]: null
                        }
                    }
                },
                {
                model: GastoExtra,
                    attributes: { 
                        exclude: ['id_pago_parcial', 'id_pago_alquiler'] 
                    },
                    as: 'gastos_extra',
                    required: false,
                    where:{
                        id_pago_parcial: {
                            [Op.is]: null
                        }
                    }
                },
                {
                model: Estado,
                    attributes: ['nombre'],
                    as: 'estado'
                },
                {
                model: Alquiler,
                    attributes: ["id","porcentaje_mora_diaria","dia_inicial_mora","dia_vencimiento_inquilino","dia_vencimiento_propietario"],
                    as: 'alquiler',
                    include: [
                        {
                            model: models.FormaDePago,
                            as: 'forma_de_pago'   
                        },
                        {
                            model: models.Moneda,
                            as: 'moneda'
                        }
                    ]
                }                 
            ]
        });
        if (!pago) {
            return res.status(404).json({ errors: 'El Alquiler para el período seleccionado no ha sido devengado.' });
        };
        const estadosValidos = ["Pendiente de Pago", "Pagado Parcialmente"];
        if (!estadosValidos.includes(pago.estado.nombre)) 
            return res.status(404).json({ errors: 'Este Alquiler ya fue pagado.' });
        
        pago.mensajeMora = `${pago.alquiler.porcentaje_mora_diaria}% Diaria a partir del dia ${pago.alquiler.dia_inicial_mora} de cada Mes`;
        // buscar saldo actual
        const saldoActual = await obtenerSaldoActualNuevo(pago.alquiler.id);
        if (saldoActual.origen == 'Error')
            return res.status(404).json({ errors: 'Error con los saldos.' });
        const JSONPago = pago.toJSON();
        JSONPago.origen_saldo = saldoActual.origen;
        JSONPago.descripcionSaldo = saldoActual.descripcionSaldo;
        JSONPago.saldo_a_la_fecha = saldoActual.montoSaldo;
        await Promise.all(JSONPago.detalles_servicios.map(async (servicio) => {
            const gastoFijo = await GastoFijo.findOne({
                where: {
                    id_alquiler: servicio.id_alquiler,
                    id_servicio: servicio.id_servicio,
                },
                include: [{
                    model: Servicio,
                    as: 'servicio'
                }]
            });
            if (gastoFijo){
                servicio.nombre_tipo_pago = AlquilerController.obtenerNombreTipoGastoFijo(gastoFijo.tipo_pago);
                servicio.tipo_pago = gastoFijo.tipo_pago;
                servicio.dia_vencimiento = gastoFijo.dia_vencimiento;
                servicio.numero_cliente = gastoFijo.numero_cliente;
                servicio.numero_contrato = gastoFijo.numero_contrato;
                servicio.disponible = (gastoFijo.tipo_pago == 2 ? false : true);
                servicio.nombre = gastoFijo.servicio.nombre;
                servicio.pagado = false;
            }
        }));
        delete JSONPago.id_estado;
        delete JSONPago.monto_mora;
        res.status(200).json(JSONPago);
    } catch (error) {
        console.error('Error al obtener el alquiler por ID:', error);
        res.status(500).json({ errors: 'Error al obtener el alquiler por ID.' });
    }

}

const obtenerSaldoActualNuevo = async (id) =>{
    // Validar que el ID sea un número entero
    const saldoAlquiler = {
        id: -1,
        origen: 'No existe un saldo',
        descripcionSaldo: 'No existe un saldo.',
        montoSaldo: '0'
    };
    if (!Number.isInteger(Number(id))) 
        return saldoAlquiler;
    try {
        const alquiler = await Alquiler.findOne({
            attributes: ["id"],
            where: {
                id: id
            },
            include: [
                {
                    model: PagoAlquiler,
                        as: 'pagos',
                        attributes: ["id"],
                        include:[
                            {
                                model: PagoParcial,
                                attributes: ["id"],
                                as: 'pagos_parciales'
                            }                        
                        ]
                },
            ]
        })
        const pagosParciales = [];
        const JSONSaldo = alquiler.toJSON();
        if (Object.keys(alquiler.pagos).length > 0){
            JSONSaldo.pagos.forEach((pago) => {
                pago.pagos_parciales.forEach(pago_parcial => {
                    pagosParciales.push(pago_parcial.id);
                });
            });
        }
        if (Object.keys(pagosParciales).length > 0){
            const saldo = await Saldo.findAll({
                where: {
                    id_pago_parcial_origen : {
                        [Op.in] : pagosParciales
                    },
                    id_pago_parcial_cubierto : {
                        [Op.is] : null
                    }
                }
            })
            if (Object.keys(saldo).length == 0)
                return saldoAlquiler;
            else if (Object.keys(saldo).length > 1){
                const errorSaldoAlquiler = {
                    id: -1,
                    origen: 'Error',
                    descripcionSaldo: 'No existe un saldo.',
                    montoSaldo: '0'
                };
                return errorSaldoAlquiler;
            }
            else{
                saldoAlquiler.id = saldo[0].id,
                saldoAlquiler.origen = (saldo[0].quien_pago ? 'Inmobiliaria' : 'Inquilino');
                saldoAlquiler.descripcionSaldo = saldo[0].descripcion;
                saldoAlquiler.montoSaldo = saldo[0].monto;
            }
        }
        return saldoAlquiler;
    } catch (error) {
        console.error('Error al obtener el saldo:', error);
        return saldoAlquiler;
    }
}

const obtenerSaldoDeUnPago = async (id) =>{
    // Validar que el ID sea un número entero
    const saldoAlquiler = {
        id: -1,
        origen: 'No existe un saldo',
        descripcionSaldo: 'No existe un saldo.',
        montoSaldo: '0'
    };
    if (!Number.isInteger(Number(id))) 
        return saldoAlquiler;
    try {
        /*
        const pago = await PagoAlquiler.findOne({
            where: {id: id},
            attributes: ["id"],
            include:[
                {
                    model: PagoParcial,
                    attributes: ["id"],
                    as: 'pagos_parciales',
                    where: {}
                }                        
            ]
        })
        const pagosParciales = [];

        pago.pagos_parciales.forEach(pago_parcial => {
            pagosParciales.push(pago_parcial.id);
        });
        */
        const pago = await PagoParcial.findOne({
            where: {
                id_pago_alquiler: id
            },
            order: [['id', 'DESC']],
            limit: 1
        });
        if (pago){
            const saldo = await Saldo.findOne({
                where: {
                    id_pago_parcial_origen : {
                        [Op.eq] : pago.id
                    }
                }
            })
            if (!saldo){
                return saldoAlquiler;
            }
            else{
                saldoAlquiler.id = saldo.id,
                saldoAlquiler.origen = (saldo.quien_pago ? 'Inmobiliaria' : 'Inquilino');
                saldoAlquiler.descripcionSaldo = saldo.descripcion;
                saldoAlquiler.montoSaldo = saldo.monto;
            }
        }
        return saldoAlquiler;
    } catch (error) {
        console.error('Error al obtener el saldo:', error);
        return saldoAlquiler;
    }
}

const completarPagoInmobiliaria = async (req, res) =>{
    const { id } = req.body;    
    if (!Number.isInteger(Number(id)))
        return res.status(400).json({ errors: 'El Pago seleccionado no es válido.' });
    await sequelize.authenticate();
    const t = await sequelize.transaction();
    let idAlquilerOrig = -1;
    try{
        const serviciosPendientesMonto = await DetallePagoServicio.findAll({
            where: {
                id_pago_alquiler: id,
                id_pago_parcial: {
                    [Op.is] : null
                }
            }
        });
        for (const servicio of serviciosPendientesMonto) {
            const gastoFijo = await GastoFijo.findOne({
                where: {
                    id_alquiler: servicio.id_alquiler,
                    id_servicio: servicio.id_servicio
                }
            })
            if (!gastoFijo){
                await t.rollback();
                return res.status(400).json({error: 'Error al registrar el pago.'});
            }
            if (gastoFijo.tipo_pago < 2 && servicio.monto == 0){
                await t.rollback();
                return res.status(400).json({error: 'No se puede completar el pago porque hay servicios sin asignar valor.'});
            }
        };    
        const gastosExtraPendientesPago = await models.GastoExtra.findAll({
            where: {
                id_pago_alquiler: id,
                id_pago_parcial: {
                    [Op.is] : null
                }
            }
        })
        if (Object.keys(gastosExtraPendientesPago).length > 0){
            t.rollback();
            return res.status(400).json({error: 'No se puede completar el pago porque hay gastos extra sin completar.'}); 
        }
        const alquiler = await PagoAlquiler.findOne({
            where:{
                id: id
            },
            attributes: ['id', 'id_alquiler'],
            include: [
                {
                    model: Alquiler,
                    attributes: ['id', 'id_forma_de_pago'],
                    as: 'alquiler',
                    include:{
                        model: FormaDePago,
                        as: 'forma_de_pago'
                    }
                },
            ]
            
        })
        idAlquilerOrig = alquiler.id_alquiler;
        const saldoActual = await obtenerSaldoActualNuevo(alquiler.id_alquiler);
        let monto_saldar = 0;
        const origen_saldo = saldoActual.origen;
        const monto_saldo_pendiente = saldoActual.montoSaldo;
        if (origen_saldo == 'Error'){
            t.rollback();
            return res.status(400).json({ errors: 'Error con los saldos.' });
        }
        if (origen_saldo != '')
            monto_saldar += (origen_saldo == 'Inquilino' ?  -1 * monto_saldo_pendiente : monto_saldo_pendiente)
        //Ahora completo los pagos de los servicios restantes.
        const gastosFijosPendientes = await DetallePagoServicio.findAll({
            where: {
                id_pago_alquiler: id,
                id_pago_parcial: {
                    [Op.is]: null
                }
            }
        })
        if (Object.keys(gastosFijosPendientes).length == 0){
            t.rollback();
            return res.status(400).json({ errors: 'Error con los saldos.' });
        }
        let total_completado = 0;
        gastosFijosPendientes.forEach(gasto_fijo => {
            total_completado += gasto_fijo.monto;
        });
        const pagoValue = {
            id_pago_alquiler: id,
            id_forma_de_pago: alquiler.alquiler.id_forma_de_pago,
            fecha_pago: new Date(),
            paga_inquilino: false,
            monto: Math.abs(total_completado - monto_saldo_pendiente)
        }
        const pagoNuevo = await PagoParcial.create(pagoValue, { transaction: t });
        //Actualizo los gastos fijos pendientes
        await Promise.all(gastosFijosPendientes.map(async (gasto) => {
            const gastoOrig = await DetallePagoServicio.findOne({ where: { id: gasto.id } });
            if (gastoOrig) {
                const changesGastoFijo = {
                    id_pago_parcial: pagoNuevo.id,
                };
                // Aquí actualizamos directamente los campos, sin el objeto intermedio
                await gastoOrig.update(changesGastoFijo, { transaction: t });
            }
        }));
        
        //Cambio el estado del Pago
        let id_nuevo_estado = await EstadoController.obtenerIdEstadoPorParametro('Pagado por Inmobiliaria','Pago');
        await alquiler.update({ id_estado: id_nuevo_estado }, { transaction: t });
        await t.commit();
        //Reviso si fue utilizado un saldo
        let saldoActualActualizar = null;
        if (saldoActual.id == '-1'){
            //Creo un saldo desde 0.
            const saldoNuevo = {
                id_pago_parcial_origen: pagoNuevo.id,
                id_pago_parcial_cubierto: null,
                descripcion: 'Completado el pago del Alquiler',
                monto: pagoNuevo.monto,
                quien_pago: true
            }
            await Saldo.create(saldoNuevo);
        }
        else
        {
            saldoActualActualizar = await Saldo.findByPk(saldoActual.id);
            if (saldoActual.origen === 'Inquilino'){
                if (total_completado >= monto_saldo_pendiente){
                    await saldoActualActualizar.update({ id_pago_parcial_cubierto: pagoNuevo.id });
                    if (total_completado > monto_saldo_pendiente){
                        const saldoNuevo = {
                            id_pago_parcial_origen: pagoNuevo.id,
                            id_pago_parcial_cubierto: null,
                            descripcion: 'A favor de la inmobiliaria luego de saldar deuda con inquilino.',
                            monto: total_completado - monto_saldo_pendiente,
                            quien_pago: true
                        }
                        await Saldo.create(saldoNuevo);
                    }   
                }
                else
                {
                    await saldoActualActualizar.update({ id_pago_parcial_cubierto: pagoNuevo.id });
                    const saldoNuevo = {
                        id_pago_parcial_origen: pagoNuevo.id,
                        id_pago_parcial_cubierto: null,
                        descripcion: 'Saldo a favor del inquilino',
                        monto: monto_saldo_pendiente - total_completado,
                        quien_pago: false
                    }
                    await Saldo.create(saldoNuevo);
                }
            }
            else if (saldoActual.origen === 'Inmobiliaria'){
                await saldoActualActualizar.update({ id_pago_parcial_cubierto: pagoNuevo.id });
                const saldoNuevo = {
                    id_pago_parcial_origen: pagoNuevo.id,
                    id_pago_parcial_cubierto: null,
                    descripcion: 'Saldo a favor de la inmobiliaria',
                    monto: monto_saldo_pendiente + total_completado,
                    quien_pago: true
                }
                await Saldo.create(saldoNuevo);
            }
        }
        //Reviso si fue el último pago del alquiler y si este se encontraba finalizado.
        if (idAlquilerOrig != -1){
            const alquilerOrig = await Alquiler.findByPk(idAlquilerOrig);
            const id_estado_finalizado_pagos_pendientes = await EstadoController.obtenerIdEstadoPorParametro('Finalizado pendiente de pagos', 'Alquiler');
            const id_estado_finalizado = await EstadoController.obtenerIdEstadoPorParametro('Finalizado', 'Alquiler');
            if (alquilerOrig.id_estado == id_estado_finalizado_pagos_pendientes){
                const poseeDeuda = await poseePagosPendientes(alquilerOrig.id);
                if (!poseeDeuda){
                    const updateAlquiler = {
                        id_estado: id_estado_finalizado
                    }
                    await alquilerOrig.update(updateAlquiler);
                }
            }
        }
        return res.status(201).json({ message: 'Pago completado con éxito.' });        
    }
    catch (error) {
        console.error('Error al obtener el alquiler por ID:', error);
        res.status(500).json({ errors: 'Error al obtener el alquiler por ID.' });
    }    
    return res.status(200).json({ error: 'Se puede completar el pago'});
}

const obtenerServiciosModificarMonto = async (req, res) => {
    const { id } = req.params; 
    if (!Number.isInteger(Number(id)))
        return res.status(400).json({ errors: 'El Pago seleccionado no es válido.' });
    const pago = await models.PagoAlquiler.findByPk(id, {
        attributes: ['id','id_alquiler'],
        include: [    
            {
                model: Alquiler,
                attributes: ['id'],
                as: 'alquiler',
                include:{
                    model: Moneda,
                    attributes: ['nombre', 'descripcion'],
                    as: 'moneda'
                }
            },
            {   
                model: DetallePagoServicio,
                    attributes: { 
                        exclude: ['id_pago_parcial', 'id_pago_alquiler'] 
                    },
                    as: 'detalles_servicios',
                    required: false,
                    where:{
                        id_pago_parcial: {
                            [Op.is]: null
                        }
                    },
                    include: [
                        {
                            model: models.GastoFijo,
                            as: 'gasto_fijo',
                            include: [ 
                                {
                                    model: models.Servicio,
                                    as: 'servicio'
                                }
                            ]
                        }
                    ],
            }
        ]
    });
    const JSONPago = pago.toJSON();
    JSONPago.moneda = JSONPago.alquiler.moneda.nombre;
    JSONPago.descri_moneda = JSONPago.alquiler.moneda.descripcion;
    delete JSONPago.alquiler.moneda;
    delete JSONPago.alquiler;
    JSONPago.detalles_servicios.forEach((servicio) => {
        servicio.nombre_tipo_pago = AlquilerController.obtenerNombreTipoGastoFijo(servicio.gasto_fijo.tipo_pago);
        servicio.tipo_pago = servicio.gasto_fijo.tipo_pago;
        servicio.dia_vencimiento = servicio.gasto_fijo.dia_vencimiento;
        servicio.numero_cliente = servicio.gasto_fijo.numero_cliente;
        servicio.numero_contrato = servicio.gasto_fijo.numero_contrato;
        servicio.nombre = servicio.gasto_fijo.servicio.nombre;
        delete servicio.servicio;
        delete servicio.gasto_fijo;
        delete servicio.id_alquiler; 
        delete servicio.id_servicio;
    });
    res.status(200).json(JSONPago);
}

const modificarMontoServicios = async (req, res) => {
    await sequelize.authenticate();
    const t = await sequelize.transaction();
    try{
        // Convertir campos vacíos a undefined
        convertirVaciosAUndefined(req.body);
        const id_pago_alquiler = req.body.id_pago_alquiler;
        // Extraer datos de alquiler del cuerpo de la solicitud y juntarlos
        if (!Number.isInteger(Number(id_pago_alquiler))) {
            t.rollback();
            return res.status(400).json({ errors: 'Los datos no son validos.' });
        }
        const pagoDevengado = await PagoAlquiler.findOne({id: id_pago_alquiler});
        if (!pagoDevengado){
            t.rollback();
            return res.status(400).json({ errors: 'No se ha devengado el alquiler para el período elegido.' });
        }
        //Puedo saber si existe con el estado del PagoAlquiler
        const gastos_fijos = construirDetalleGastosFijosModificar(req.body.gastos_fijos);
        if (gastos_fijos.length > 0){
            for (const gasto_fijo of gastos_fijos) {
                if (gasto_fijo.monto < 0){
                    await t.rollback();
                    const errorMessage = `El precio del servicio: ${gasto_fijo.nombre} no es válido.`
                    return res.status(400).json({ errors: errorMessage });
                }
            }
        }
        // Actualizar gastos fijos y gastos extras
        let hayCambiosServicios = false;
        await Promise.all(gastos_fijos.map(async (gasto) => {
            const gastoOrig = await DetallePagoServicio.findOne({ where: { id: gasto.id } });
            if (gastoOrig && gastoOrig.id_pago_parcial == null && gastoOrig.monto !== gasto.monto) {
                hayCambiosServicios = true;
                await gastoOrig.update({monto: gasto.monto}, { transaction: t });       
            }
        }));
        t.commit();
        const resultado = (hayCambiosServicios ? 'Monto de servicios actualizados con éxito.' : 'No se han realizado cambios.');
        return res.status(201).json({ message: resultado });
        // Actualizar el estado del pago solo después de todas las operaciones
    }
    catch (error) {
        res.status(500).json({ errors: 'Error al modificar el monto de los servicios.' });
    }    
}

const poseePagosPendientes = async (idAlquiler) => {
    const alquiler = await Alquiler.findByPk(idAlquiler);
    const fechaInicio = alquiler.fecha_inicio_contrato;
    const fechaFin = alquiler.fecha_fin_contrato;
    const fechasPendientes = await obtenerFechasPendientesDevengar(fechaInicio, fechaFin, alquiler.id);
    if (Object.keys(fechasPendientes).length > 0)
        return true;
    const id_estado_pagado = await EstadoController.obtenerIdEstadoPorParametro('Pagado','Pago');
    const id_estado_pagado_x_inmo = await EstadoController.obtenerIdEstadoPorParametro('Pagado por Inmobiliaria','Pago');
    const id_estados_pagos = [];
    id_estados_pagos.push(id_estado_pagado);
    id_estados_pagos.push(id_estado_pagado_x_inmo);
    const pagosPendientes = await models.PagoAlquiler.findAll({
        where:{
            id_alquiler: alquiler.id,
            id_estado:{
                [Op.notIn] : id_estados_pagos
            }
        }
    })
    if (Object.keys(pagosPendientes).length > 0)
        return true;
    return false;
}

module.exports = {
    getPagosAlquiler,
    obtenerDatosDevengar,
    calcularTotalAPagar,
    buscarMayorFecha,
    obtenerPrecioAlquiler,
    devengarAlquiler,
    calcularTotalPagado,
    calcularTotalPagadoNumerico,
    obtenerDetallePagoAlquiler,
    registrarPagoAlquiler,
    obtenerDatosRegistrarPago,
    completarPagoInmobiliaria,
    obtenerServiciosModificarMonto,
    modificarMontoServicios,
    poseePagosPendientes
}