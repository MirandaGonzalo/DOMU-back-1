const Alquiler = require("../models/alquiler");
const DetalleLiquidacionPago = require("../models/detalle_liquidacion_pago");
const Estado = require("../models/estado");
const LiquidacionPropietario = require("../models/liquidacion_propietario");
const PagoAlquiler = require("../models/pago_alquiler");
const PagoParcial = require("../models/pago_parcial");
const Persona = require("../models/persona");
const Inmueble = require("../models/inmueble");
const Direccion = require("../models/direccion");
const LocalComercial = require("../models/localComercial");
const Vivienda = require("../models/vivienda");
const Casa = require("../models/casa");
const Departamento = require("../models/departamento");
const Moneda = require("../models/moneda");
const DetallePagoServicio = require("../models/detalle_pago_servicio");
const GastoExtra = require("../models/gasto_extra");

const InmuebleController = require("../controllers/inmuebleController");
const PagoAlquilerController = require("../controllers/pagoAlquilerController");

const { Op, where } = require("sequelize");
const GastoFijo = require("../models/gasto_fijo");
const Servicio = require("../models/servicio");

const { concatenarMontoYMoneda, convertirVaciosAUndefined } = require('../utilities/functions');
const FormaDePago = require("../models/forma_de_pago");
const { registrarLiquidacionSchema } = require("../validators/liquidacionValidator");
const { sequelize } = require("../models");

const contarPagosPendientesLiquidacion = (propietario) => {
    let cantidad_pagos_pendientes = 0;

    propietario.alquileres.forEach(alquiler => {
        for (let i = alquiler.pagos.length - 1; i >= 0; i--) {
            const pago = alquiler.pagos[i];
            if (pago.liquidacion_propietarios.length === 0) {
                cantidad_pagos_pendientes++;
            } else {
                alquiler.pagos.splice(i, 1);
            }
        }
    });

    return cantidad_pagos_pendientes;
}

const buscarFechaUltimaLiquidacion = (propietario) => {
    let ultima_fecha = '';

    propietario.alquileres.forEach(alquiler => {
        alquiler.pagos.forEach(pago => {
            if(pago.liquidacion_propietarios.length > 0){
                const fecha = pago.liquidacion_propietarios[0].fecha_liquidacion
                if(fecha > ultima_fecha){
                    ultima_fecha = fecha;
                }
            }
        })
    });

    return ultima_fecha;
}

const calcularMontoLiquidacion = (liquidacion)=> {
    let monto = 0;

    liquidacion.pago_alquilers.forEach(pago => {
        //pago.pagos_parciales.forEach(pago_parcial => {
        //    monto += pago_parcial.monto
        //})
        monto += calcularTotalALiquidar(pago);
    });

    return monto;
}

const identificarMonedas = (propietario) => {
    const monedas = new Set();

    propietario.alquileres.forEach((alquiler) => {
        monedas.add(alquiler.moneda.id)
    })

    return [...monedas]; 
}

const filtrarAlquileresPorMoneda = (propietario, moneda) => {
    propietario.alquileres = propietario.alquileres.filter(alquiler => alquiler.moneda.id === moneda)
}

const separarPorMoneda = (propietarios) => {

    const resultado = []

    for (let i = 0; i < propietarios.length; i++) {
        //identificar monedas del propietario
        const monedas = identificarMonedas(propietarios[i]);

        if(monedas.length > 1){

            monedas.forEach((moneda) => {

                const propietarioMoneda = JSON.parse(JSON.stringify(propietarios[i]))
                
                filtrarAlquileresPorMoneda(propietarioMoneda, moneda);

                resultado.push(propietarioMoneda);
            });
        }
        else{
            resultado.push(propietarios[i].toJSON());
        }
    }

    return resultado;
    
}


const tieneAlquileresActivos = (alquileres) => {
    let activo = false;

    alquileres.forEach(alquiler => {
        if(alquiler.estado.nombre == 'Vigente' || alquiler.estado.nombre == 'Por Iniciar' || alquiler.pagos.length > 0){
            activo = true
        }
    })

    return activo;
}

const filtrarInactivos = (propietarios) => {
    return propietarios.filter(propietario => tieneAlquileresActivos(propietario.alquileres) == true)
}

const getListadoLiquidacionesPendientes = async (req, res) => {
    try{
        const propietarios = await Persona.findAll({
            attributes: ['dni', 'nombre'],
            include: {
                model: Alquiler,
                attributes: ['id'],
                as: 'alquileres',
                required: true,
                include: [
                    {
                        model: PagoAlquiler,
                        attributes: ['id'],
                        as: 'pagos',
                        include: [
                            {
                                model: Estado,
                                attributes: ['nombre'],
                                as: 'estado',
                                where: {
                                    [Op.or]: [{ nombre: 'Pagado' }, { nombre: 'Pagado por Inmobiliaria' }]
                                },
                            },
                            {
                                model: LiquidacionPropietario,
                                attributes: ['id', 'fecha_liquidacion']
                            }
                        ]
                    },
                    {
                        model: Moneda,
                        as: 'moneda'
                    },
                    {
                        model: Estado,
                        attributes: ['nombre'],
                        as: 'estado'
                    }
                ]
            },
            
        });

        const propietariosSeparados = separarPorMoneda(propietarios);
        const ptopietariosFiltrados = filtrarInactivos(propietariosSeparados);

        const resultado = await Promise.all(ptopietariosFiltrados.map(async (propietario) => {

            const JSONPropietario = propietario;

            JSONPropietario.nombre_dni = `${propietario.nombre} - ${propietario.dni}`

            JSONPropietario.inmuebles_propios = propietario.alquileres.length;

            JSONPropietario.fecha_ultima_liquidacion = buscarFechaUltimaLiquidacion(propietario);

            JSONPropietario.pagos_pendientes_liquidacion = contarPagosPendientesLiquidacion(JSONPropietario);

            JSONPropietario.moneda = JSONPropietario.alquileres[0].moneda;
            JSONPropietario.moneda.nombre_descripcion = `(${JSONPropietario.moneda.descripcion}) ${JSONPropietario.moneda.nombre}`
            
            JSONPropietario.alquileres.forEach(alquiler => {
                delete alquiler.moneda;
                delete alquiler.estado;
            })

            return {
                JSONPropietario
            }
        }));

        return res.status(200).json(resultado);
    }
    catch(error){
        console.error('Error al obtener los propietarios:', error);
        return res.status(500).json({ errors: 'Error al obtener los propietarios.' });
    }
};

const getHistorialLiquidaciones = async (req, res) => {
    const { dni } = req.params;

    if (!Number.isInteger(Number(dni))) {
        return res.status(400).json({ errors: 'El DNI debe ser un número entero válido.' });
    }
    
    try {
        // Buscar a la persona con el DNI
        const persona = await Persona.findOne({
            where: { dni },  // Suponiendo que 'dni' es el campo en Persona
            include: {
                model: Alquiler,
                attributes: ['id'],
                as: 'alquileres',  // Relación definida en Persona
                include: [
                    {
                        model: PagoAlquiler,
                        attributes: ['id'],
                        as: 'pagos',  // Relación definida en Alquiler
                        include: 
                        [   
                            {
                                model: LiquidacionPropietario,
                                through: DetalleLiquidacionPago,
                                attributes: ['id', 'fecha_liquidacion', 'porcentaje_comision'],
                                include:[
                                    {
                                        model: PagoAlquiler,
                                        attributes: ['id', 'precio_alquiler', 'monto_mora'],
                                        include: [
                                            {
                                                model: DetallePagoServicio,
                                                attributes: ['monto'],
                                                as: 'detalles_servicios',
                                                include:[
                                                    {
                                                        model: GastoFijo,
                                                        attributes: ['tipo_pago'],
                                                        as: 'gasto_fijo'
                                                    }
                                                ]
                                            },
                                            {
                                                model: GastoExtra,
                                                attributes: ['monto', 'quien_pago', 'a_quien_cobrar'],
                                                as: 'gastos_extra'
                                            },
                                            {
                                                model: PagoParcial,
                                                attributes: ['id', 'monto'],
                                                as: 'pagos_parciales'
                                            },
                                            {
                                                model: Alquiler,
                                                attributrs: ['id'],
                                                as: 'alquiler',
                                                include: {
                                                    model: Moneda,
                                                    as: 'moneda'
                                                }
                                            }
                                        ]
                                    }
                                ]

                            }
                        ]
                    },
                ]
            },
        });
      
        if (!persona) {
            return res.status(404).json({ message: 'Propietario no encontrado' });
        }
      
        // Usamos un Set para almacenar IDs únicos de liquidaciones y evitar duplicados
        //const liquidacionSet = new Set();
        const liquidaciones = [];
        const ids_liquidaciones = [];
      
        // Recorremos los alquileres y pagos para obtener las liquidaciones
        persona.alquileres.forEach(alquiler => {
            alquiler.pagos.forEach(pago => {
                pago.liquidacion_propietarios.forEach(JSONLiquidacion => {
                    if(!ids_liquidaciones.includes(JSONLiquidacion.id)){
                        liquidaciones.push(JSONLiquidacion);
                        ids_liquidaciones.push(JSONLiquidacion.id);
                    }
                    
                });
            });
        });
      
        // Convertimos el Set de liquidaciones de vuelta a un array
        //const liquidaciones = Array.from(liquidacionSet)
        //    .map(liquidacion => JSON.parse(liquidacion))
        //    .sort((a, b) => new Date(b.fecha_liquidacion) - new Date(a.fecha_liquidacion));

        const resultado = await Promise.all(liquidaciones.map(async (liquidacion) => {
            const JSONLiquidacion = liquidacion.toJSON();
            JSONLiquidacion.cantidad_pagos = JSONLiquidacion.pago_alquilers.length;
            const monto_liquidado = calcularMontoLiquidacion(JSONLiquidacion);
            const comision = monto_liquidado * JSONLiquidacion.porcentaje_comision / 100;

            const moneda = JSONLiquidacion.pago_alquilers[0].alquiler.moneda;
            JSONLiquidacion.monto_liquidado = `${moneda.descripcion} (${moneda.nombre}) ${monto_liquidado - comision}`;
            JSONLiquidacion.comision = `${moneda.descripcion} (${moneda.nombre}) ${comision} (${JSONLiquidacion.porcentaje_comision}%)`

            delete JSONLiquidacion.detalle_liquidacion_pago
            //delete JSONLiquidacion.pago_alquilers
            
            return {
                JSONLiquidacion
            };
        }));
      
        return res.json(resultado);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al obtener las liquidaciones' });
    }
};

const calcularTotalGastosFijosALiquidar = (detalles_servicios) => {

    let total_gastos_fijos = 0;

    detalles_servicios.forEach(detalle_servicio => {
        if(detalle_servicio.gasto_fijo.tipo_pago == 1) total_gastos_fijos += detalle_servicio.monto;
    });

    return total_gastos_fijos;
}

const calcularTotalGastosExtraALiquidar = (gastos_extra) => {

    let total_gastos_extras = 0;

    gastos_extra.forEach(gasto_extra => {
        if(gasto_extra.quien_pago == 1 && gasto_extra.a_quien_cobrar == 2) total_gastos_extras += gasto_extra.monto;
        else if(gasto_extra.a_quien_cobrar == 1) total_gastos_extras -= gasto_extra.monto; 
    });

    return total_gastos_extras;
}

const calcularTotalALiquidar = (pago) => {
    let totalAPagar = pago.precio_alquiler;

    totalAPagar += calcularTotalGastosFijosALiquidar(pago.detalles_servicios);

    totalAPagar += calcularTotalGastosExtraALiquidar(pago.gastos_extra);

    totalAPagar += pago.monto_mora

    return totalAPagar;
};

const obtenerDetalleLiquidacionPendiente= async (req, res) => {
    try{
        const dni = req.query.dni;
        const id = req.query.id;

        if (!Number.isInteger(Number(dni))) {
            return res.status(400).json({ errors: 'El DNI debe ser un número entero válido.' });
        }

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ errors: 'El id de moneda debe ser un número entero válido.' });
        }

        const propietario = await Persona.findOne({
            where: {dni: dni},
            attributes: ['dni', 'nombre'],
            include: {
                model: Alquiler,
                attributes: ['id'],
                as: 'alquileres',
                required: true,
                include: 
                [
                    {
                        model: Inmueble,
                        attributes: ['id', 'codigo'],
                        as: 'inmueble',
                        include: [
                            {
                                model: Direccion,
                                attributes: ['numero', 'calle', 'barrio', 'localidad', 'provincia'],
                                as: 'direccion'
                            },
                            {
                                model: LocalComercial,
                                attributes: ['id_inmueble'],
                                as: 'local_comercial',
                                required: false
                            },
                            {
                                model: Vivienda,
                                attributes: ['id_inmueble'],
                                as: 'vivienda',
                                required: false,
                                include: [
                                    {
                                        model: Casa,
                                        attributes: ['id_vivienda'],
                                        as: 'casa',
                                        required: false
                                    },
                                    {
                                        model: Departamento,
                                        attributes: ['id_vivienda'],
                                        as: 'departamento',
                                        required: false 
                                    }
                                ]
                            }
                        
                        ]
                    
                    },
                    {
                        model: Persona,
                        attributes: ['dni', 'nombre'],
                        as: 'persona'
                    },
                    {
                        model: PagoAlquiler,
                        attributes: ['id', 'mes_correspondiente', 'precio_alquiler','monto_mora'],
                        as: 'pagos',
                        include: [
                            {
                                model: Estado,
                                attributes: ['nombre'],
                                as: 'estado',
                                where: {
                                    [Op.or]: [{ nombre: 'Pagado' }, { nombre: 'Pagado por Inmobiliaria' }]
                                },
                            },
                            {
                                model: LiquidacionPropietario,
                                attributes: ['id', 'fecha_liquidacion']
                            },
                            {
                                model: DetallePagoServicio,
                                attributes: ['monto'],
                                as: 'detalles_servicios',
                                include:[
                                    {
                                        model: GastoFijo,
                                        attributes: ['tipo_pago'],
                                        as: 'gasto_fijo'
                                    }
                                ]
                            },
                            {
                                model: GastoExtra,
                                attributes: ['monto', 'quien_pago', 'a_quien_cobrar'],
                                as: 'gastos_extra'
                            },
                            {
                                model: PagoParcial,
                                attributes: ['fecha_pago'],
                                as: 'pagos_parciales'
                            },
                        ]
                    },
                    {
                        model: Moneda,
                        as: 'moneda'
                    }
                ]
            },

        });

        const moneda = await Moneda.findOne({
            where: {id: id}
        })

        
        if (!propietario) {
            return res.status(404).json({ errors: 'Propietario no encontrado.' });
        }

                
        if (!moneda) {
            return res.status(404).json({ errors: 'Moneda no encontrada.' });
        }

        const JSONPropietario = propietario.toJSON();

        filtrarAlquileresPorMoneda(JSONPropietario, moneda.id)

        if (JSONPropietario.alquileres.length == 0){
            return res.status(404).json({ errors: 'El propietario ingresado no posee alquileres con la moneda ingresada' });
        }

        JSONPropietario.nombre_dni = `${propietario.nombre} - ${propietario.dni}`

        JSONPropietario.inmuebles_propios = propietario.alquileres.length;

        JSONPropietario.moneda = JSONPropietario.alquileres[0].moneda;
        JSONPropietario.moneda.nombre_descripcion = `(${JSONPropietario.moneda.descripcion}) ${JSONPropietario.moneda.nombre}`;

        //por cada alquiler del propietario
        JSONPropietario.alquileres.forEach(alquiler => {
            //concatenar direccion
            alquiler.inmueble.resumen_direccion = `${alquiler.inmueble.direccion.calle} ${alquiler.inmueble.direccion.numero} - ${alquiler.inmueble.direccion.localidad}, ${alquiler.inmueble.direccion.barrio}`;       
            delete alquiler.inmueble.direccion;

            //identificar tipo
            alquiler.inmueble.tipo = InmuebleController.obtenerTipoInmueble(alquiler.inmueble);
            delete alquiler.inmueble.local_comercial;
            delete alquiler.inmueble.vivienda;

            //concatenar inquilino
            alquiler.inquilino = alquiler.persona;
            delete alquiler.persona;
            alquiler.inquilino.nombre_dni = `${alquiler.inquilino.nombre} - ${alquiler.inquilino.dni}`;

            ///por cada pago del alquiler
            alquiler.pagos.forEach(pago => {
                //pago.totalAPagar = PagoAlquilerController.calcularTotalAPagar(pago, alquiler.moneda);
                pago.totalAPagar = concatenarMontoYMoneda(calcularTotalALiquidar(pago), alquiler.moneda);
                pago.fecha = PagoAlquilerController.buscarMayorFecha(pago);

                delete pago.detalles_servicios;
                delete pago.gastos_extra;
                delete pago.pagos_parciales;

            })

            delete alquiler.moneda;

        })


        JSONPropietario.pagos_pendientes_liquidacion = contarPagosPendientesLiquidacion(JSONPropietario);

        JSONPropietario.fecha_ultima_liquidacion = buscarFechaUltimaLiquidacion(propietario);

        return res.status(200).json(JSONPropietario);
    }
    catch(error){
        console.error('Error al obtener el detalle de pendientes del propietario:', error);
        return res.status(500).json({ errors: 'Error al obtener el detalle de pendientes del propietario.' });
    }
}

const obtenerDetalleLiquidacionHistorica = async (req, res) => {

    try{
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ errors: 'El id debe ser un número entero válido.' });
        }

        const liquidacion = await LiquidacionPropietario.findOne({
            where: { id:id },
            attributes: ['id', 'fecha_liquidacion', 'porcentaje_comision', 'observacion'],
            include: [
                {
                    model: PagoAlquiler,
                    attributes: ['id', 'mes_correspondiente', 'precio_alquiler', 'monto_mora'],
                    include: [
                        {
                            model: DetallePagoServicio,
                            attributes: ['monto'],
                            as: 'detalles_servicios',
                            include:[
                                {
                                    model: GastoFijo,
                                    attributes: ['tipo_pago'],
                                    as: 'gasto_fijo'
                                }
                            ]
                        },
                        {
                            model: GastoExtra,
                            attributes: ['monto', 'quien_pago', 'a_quien_cobrar'],
                            as: 'gastos_extra'
                        },
                        {
                            model: PagoParcial,
                            attributes: ['id', 'monto', 'fecha_pago'],
                            as: 'pagos_parciales'
                        },
                        {
                            model: Estado,
                            attributes: ['nombre'],
                            as: 'estado'
                        },
                        {
                            model: Alquiler,
                            attributes: ['id'],
                            as: 'alquiler',
                            include:[
                                {
                                    model: Persona,
                                    attributes: ['dni', 'nombre'],
                                    as: 'persona'
                                },
                                {
                                    model: Persona,
                                    attributes: ['dni', 'nombre'],
                                    as: 'propietario_principal'
                                },
                                {
                                    model: Moneda,
                                    as: 'moneda'
                                },
                                {
                                    model: Inmueble,
                                    attributes: ['id', 'codigo'],
                                    as: 'inmueble',
                                    include: [
                                        {
                                            model: Direccion,
                                            attributes: ['numero', 'calle', 'barrio', 'localidad', 'provincia'],
                                            as: 'direccion'
                                        },
                                        {
                                            model: LocalComercial,
                                            attributes: ['id_inmueble'],
                                            as: 'local_comercial',
                                            required: false
                                        },
                                        {
                                            model: Vivienda,
                                            attributes: ['id_inmueble'],
                                            as: 'vivienda',
                                            required: false,
                                            include: [
                                                {
                                                    model: Casa,
                                                    attributes: ['id_vivienda'],
                                                    as: 'casa',
                                                    required: false
                                                },
                                                {
                                                    model: Departamento,
                                                    attributes: ['id_vivienda'],
                                                    as: 'departamento',
                                                    required: false 
                                                }
                                            ]
                                        }
                                    
                                    ]
                                }
                            ]
                        },
                        
                    ]
                }
            ]
        });

        
        if (!liquidacion) {
            return res.status(404).json({ errors: 'Liquidacion no encontrada.' });
        }

        const JSONLiquidacion = liquidacion.toJSON();

        //obtener y setear datos del propietario
        const propietario = JSONLiquidacion.pago_alquilers[0].alquiler.propietario_principal;
        JSONLiquidacion.dni_propietario = propietario.dni;
        JSONLiquidacion.propietario =  `${propietario.nombre} - ${propietario.dni}`;

        let monto_liquidacion = 0;
        const moneda = JSONLiquidacion.pago_alquilers[0].alquiler.moneda;

        JSONLiquidacion.pago_alquilers.forEach(pago => {

            //calcular total pagado
            //pago.totalPagado = PagoAlquilerController.calcularTotalPagado(pago, pago.alquiler.moneda);
            pago.totalPagado = concatenarMontoYMoneda(calcularTotalALiquidar(pago), moneda)

            pago.fecha = PagoAlquilerController.buscarMayorFecha(pago);

            //identificar tipo
            pago.alquiler.inmueble.tipo = InmuebleController.obtenerTipoInmueble(pago.alquiler.inmueble);

            //concatenar direccion
            pago.alquiler.inmueble.resumen_direccion = `${pago.alquiler.inmueble.direccion.calle} ${pago.alquiler.inmueble.direccion.numero} - ${pago.alquiler.inmueble.direccion.localidad}, ${pago.alquiler.inmueble.direccion.barrio}`;       

            //concatenar inquilino
            pago.alquiler.inquilino =  pago.alquiler.persona
            pago.alquiler.inquilino.dni_nombre = `${pago.alquiler.inquilino .nombre} - ${pago.alquiler.inquilino .dni}`;

            //monto_liquidacion += PagoAlquilerController.calcularTotalPagadoNumerico(pago);
            monto_liquidacion += calcularTotalALiquidar(pago);

            delete pago.pagos_parciales;
            delete pago.alquiler.moneda;

            delete pago.alquiler.inmueble.local_comercial;
            delete pago.alquiler.inmueble.vivienda;

            delete pago.alquiler.inmueble.direccion;

            delete pago.alquiler.persona;

            delete pago.alquiler.propietario_principal;

            delete pago.detalle_liquidacion_pago;

        })

        JSONLiquidacion.total_pagado_liquidacion = `${moneda.descripcion} (${moneda.nombre}) ${monto_liquidacion}`;

        const monto_comision = monto_liquidacion*liquidacion.porcentaje_comision/100;

        monto_liquidacion -= monto_comision;

        JSONLiquidacion.monto_liquidacion = `${moneda.descripcion} (${moneda.nombre}) ${monto_liquidacion}`;
        JSONLiquidacion.monto_comision = `${moneda.descripcion} (${moneda.nombre}) ${monto_comision} (${liquidacion.porcentaje_comision}%)`


        return res.status(200).json(JSONLiquidacion);

    }
    catch(error){
        console.error(error);
        return res.status(500).json({ message: 'Error al obtener la liquidacion' });
    }
}

const buscarUltimaLiquidacion = (alquileres)  => {
    let ultima = [];
    ultima.fecha = '';

    alquileres.forEach(alquiler => {
        alquiler.pagos.forEach(pago => {
            if(pago.liquidacion_propietarios.length > 0){
                const fecha = pago.liquidacion_propietarios[0].fecha_liquidacion
                if(fecha > ultima.fecha){
                    ultima = pago.liquidacion_propietarios[0];
                }
            }
        })
    });

    return ultima;
}

const obtenerDatosRegistrarLiquidacion = async (req, res) => {
    try{
        const dni = req.query.dni;
        const id = req.query.id;

        if (!Number.isInteger(Number(dni))) {
            return res.status(400).json({ errors: 'El DNI debe ser un número entero válido.' });
        }

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ errors: 'El id de moneda debe ser un número entero válido.' });
        }

        const propietario = await Persona.findOne({
        where: {dni: dni},
        attributes: ['dni', 'nombre'],
        include: {
            model: Alquiler,
            attributes: ['id'],
            as: 'alquileres',
            required: true,
            include: 
            [
                {
                    model: Inmueble,
                    attributes: ['id', 'codigo'],
                    as: 'inmueble',
                    include: [
                        {
                            model: Direccion,
                            attributes: ['numero', 'calle', 'barrio', 'localidad', 'provincia'],
                            as: 'direccion'
                        },
                        {
                            model: LocalComercial,
                            attributes: ['id_inmueble'],
                            as: 'local_comercial',
                            required: false
                        },
                        {
                            model: Vivienda,
                            attributes: ['id_inmueble'],
                            as: 'vivienda',
                            required: false,
                            include: [
                                {
                                    model: Casa,
                                    attributes: ['id_vivienda'],
                                    as: 'casa',
                                    required: false
                                },
                                {
                                    model: Departamento,
                                    attributes: ['id_vivienda'],
                                    as: 'departamento',
                                    required: false 
                                }
                            ]
                        }
                    
                    ]                
                },
                {
                    model: Persona,
                    attributes: ['dni', 'nombre'],
                    as: 'persona'
                },
                {
                    model: PagoAlquiler,
                    attributes: ['id', 'mes_correspondiente', 'precio_alquiler','monto_mora'],
                    as: 'pagos',
                    include: [
                        {
                            model: Estado,
                            attributes: ['nombre'],
                            as: 'estado',
                            where: {
                                [Op.or]: [{ nombre: 'Pagado' }, { nombre: 'Pagado por Inmobiliaria' }]
                            },
                        },
                        {
                            model: LiquidacionPropietario,
                            attributes: ['id', 'fecha_liquidacion', 'porcentaje_comision'],
                            include:[
                                {
                                    model: FormaDePago,
                                    as: 'forma_de_pago'
                                }
                            ]
                        },
                        {
                            model: DetallePagoServicio,
                            attributes: ['monto'],
                            as: 'detalles_servicios',
                            include:[
                                {
                                    model: GastoFijo,
                                    attributes: ['tipo_pago'],
                                    as: 'gasto_fijo'
                                }
                            ]
                        },
                        {
                            model: GastoExtra,
                            attributes: ['monto', 'quien_pago', 'a_quien_cobrar'],
                            as: 'gastos_extra'
                        },
                        {
                            model: PagoParcial,
                            attributes: ['fecha_pago'],
                            as: 'pagos_parciales'
                        },
                    ]
                },
                {
                    model: Moneda,
                    as: 'moneda'
                }
            ]
        },

        });

        const moneda = await Moneda.findOne({
        where: {id: id}
        })


        if (!propietario) {
        return res.status(404).json({ errors: 'Propietario no encontrado.' });
        }

        if (!moneda) {
        return res.status(404).json({ errors: 'Moneda no encontrada.' });
        }

        const JSONPropietario = propietario.toJSON();

        filtrarAlquileresPorMoneda(JSONPropietario, moneda.id);

        if (JSONPropietario.alquileres.length == 0){
        return res.status(404).json({ errors: 'El propietario ingresado no posee alquileres con la moneda ingresada' });
        }

        JSONPropietario.nombre_dni = `${propietario.nombre} - ${propietario.dni}`;

        //aca buscar la ultima liquidacion usada
        let ultima_liquidacion = buscarUltimaLiquidacion(JSONPropietario.alquileres);
        JSONPropietario.ultimo_porcentaje = ultima_liquidacion.porcentaje_comision? ultima_liquidacion.porcentaje_comision : 0 ;
        JSONPropietario.ultima_forma_de_pago = ultima_liquidacion.forma_de_pago? ultima_liquidacion.forma_de_pago: null;

        JSONPropietario.moneda = JSONPropietario.alquileres[0].moneda;
        JSONPropietario.moneda.nombre_descripcion = `(${JSONPropietario.moneda.descripcion}) ${JSONPropietario.moneda.nombre}`


        JSONPropietario.pagos_a_liquidar = [];
        JSONPropietario.pagos_pendientes_liquidacion = contarPagosPendientesLiquidacion(JSONPropietario);

        let monto_liquidacion = 0;

        //por cada alquiler del propietario
        JSONPropietario.alquileres.forEach(alquiler => {

            //obtener inquilino
            const nombre_dni_inquilino = `${alquiler.persona.nombre} - ${alquiler.persona.dni}`;

            //identificar tipo
            const tipo_inmueble = InmuebleController.obtenerTipoInmueble(alquiler.inmueble);
            delete alquiler.inmueble.local_comercial;
            delete alquiler.inmueble.vivienda;

            //concatenar direccion
            const resumen_direccion = `${alquiler.inmueble.direccion.calle} ${alquiler.inmueble.direccion.numero} - ${alquiler.inmueble.direccion.localidad}, ${alquiler.inmueble.direccion.barrio}`; 
            delete alquiler.inmueble.direccion;
        
            //const moneda = alquiler.moneda;

            alquiler.pagos.forEach(pago => {
                pago.inquilino = nombre_dni_inquilino;
                pago.tipo_inmueble = tipo_inmueble;
                pago.resumen_direccion = resumen_direccion;
                pago.fecha = PagoAlquilerController.buscarMayorFecha(pago);

                //pago.total_alquiler = concatenarMontoYMoneda(pago.precio_alquiler+pago.monto_mora, moneda);
                //pago.total_gastos_fijos = concatenarMontoYMoneda(calcularTotalGastosFijosALiquidar(pago.detalles_servicios), moneda);
                //pago.total_gastos_extra = concatenarMontoYMoneda(calcularTotalGastosExtraALiquidar(pago.gastos_extra), moneda);

                pago.total_alquiler = pago.precio_alquiler+pago.monto_mora;
                pago.total_gastos_fijos = calcularTotalGastosFijosALiquidar(pago.detalles_servicios);
                pago.total_gastos_extra = calcularTotalGastosExtraALiquidar(pago.gastos_extra);

                pago.total = calcularTotalALiquidar(pago);
                monto_liquidacion += calcularTotalALiquidar(pago);

                delete pago.detalles_servicios;
                delete pago.gastos_extra;
                delete pago.pagos_parciales;

                JSONPropietario.pagos_a_liquidar.push(pago);
            })

        })  

        delete JSONPropietario.alquileres;
        JSONPropietario.total_pagado_liquidacion = monto_liquidacion;

        return res.status(200).json(JSONPropietario);
    }
    catch(error){
        console.error('Error al obtener los datos para liquidar:', error);
        return res.status(500).json({ errors: 'Error al obtener los datos para liquidar.' });
    }

}

const obtenerIdsPagosALiquidar = (alquileres) => {
    let pagos = []

    alquileres.forEach(alquiler  => {
        alquiler.pagos.forEach(pago => {
            pagos.push(pago.id);
        })
    })

    return pagos;
}


const registrarLiquidacion = async (req, res) => {
    try{
        await sequelize.authenticate();
        const t = await sequelize.transaction();

        const dni = req.body.dni;
        const id = req.body.id_moneda;

        if (!Number.isInteger(Number(dni))) {
            return res.status(400).json({ errors: 'El DNI debe ser un número entero válido.' });
        }

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ errors: 'El id de moneda debe ser un número entero válido.' });
        }

        // Convertir campos vacíos a undefined
        convertirVaciosAUndefined(req.body);

        const {porcentaje_comision, id_forma_de_pago, id_moneda, observacion} = req.body;
        const nueva_liquidacion = {porcentaje_comision, id_forma_de_pago, id_moneda, observacion};
        nueva_liquidacion.fecha_liquidacion = new Date().toISOString().split('T')[0];

        // Validar los datos recibidos usando Joi
        const { error: liquidacionError } = registrarLiquidacionSchema.validate(nueva_liquidacion, { abortEarly: false });

        if (liquidacionError) {
            await t.rollback();
            const errorMessage = liquidacionError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessage });
        }

        const propietario = await Persona.findOne({
            where: {dni: dni},
            attributes: ['dni', 'nombre'],
            include: {
                model: Alquiler,
                attributes: ['id'],
                as: 'alquileres',
                required: true,
                include: 
                [
                    {
                        model: PagoAlquiler,
                        attributes: ['id', 'mes_correspondiente', 'precio_alquiler','monto_mora'],
                        as: 'pagos',
                        include: [
                            {
                                model: Estado,
                                attributes: ['nombre'],
                                as: 'estado',
                                where: {
                                    [Op.or]: [{ nombre: 'Pagado' }, { nombre: 'Pagado por Inmobiliaria' }]
                                },
                            },
                            {
                                model: LiquidacionPropietario,
                                attributes: ['id', 'fecha_liquidacion', 'porcentaje_comision'],
                                include:[
                                    {
                                        model: FormaDePago,
                                        as: 'forma_de_pago'
                                    }
                                ]
                            },
                            {
                                model: DetallePagoServicio,
                                attributes: ['monto'],
                                as: 'detalles_servicios',
                                include:[
                                    {
                                        model: GastoFijo,
                                        attributes: ['tipo_pago'],
                                        as: 'gasto_fijo'
                                    }
                                ]
                            },
                            {
                                model: GastoExtra,
                                attributes: ['monto', 'quien_pago', 'a_quien_cobrar'],
                                as: 'gastos_extra'
                            },
                            {
                                model: PagoParcial,
                                attributes: ['fecha_pago'],
                                as: 'pagos_parciales'
                            },
                        ]
                    },
                    {
                        model: Moneda,
                        as: 'moneda'
                    }
                ]
            },
    
        });

        if (!propietario) {
            return res.status(404).json({ errors: 'Propietario no encontrado.' });
        }
    
        const moneda = await Moneda.findOne({
            where: {id: id}
        })
    
        if (!moneda) {
            return res.status(404).json({ errors: 'Moneda no encontrada.' });
        }
    
        const JSONPropietario = propietario.toJSON();
    
        filtrarAlquileresPorMoneda(JSONPropietario, moneda.id);
        contarPagosPendientesLiquidacion(JSONPropietario);
    
        if (JSONPropietario.alquileres.length == 0){
            return res.status(404).json({ errors: 'El propietario ingresado no posee alquileres con la moneda ingresada' });
        }
        
        const ids_pagos_a_liquidar = obtenerIdsPagosALiquidar(JSONPropietario.alquileres);
        const ids_pagos_seleccionados = req.body.pagos; 

        if(!ids_pagos_seleccionados.length > 0){
            return res.status(404).json({ errors: 'No hay pagos seleccionados!' });
        }

        const validacion_pagos = ids_pagos_seleccionados.every(pago => ids_pagos_a_liquidar.includes(pago))

        if(!validacion_pagos){
            return res.status(404).json({ errors: 'Los pagos seleccionados no corresponden o ya han sido liquidados!' });
        }

        const liquidacion = await LiquidacionPropietario.create(nueva_liquidacion, { transaction: t });

        const detalles_liquidacion_pago = []
        ids_pagos_seleccionados.forEach(id_pago => {
            const detalle_liquidacion_pago = {id_pago_alquiler: id_pago, id_liquidacion: liquidacion.id}
            detalles_liquidacion_pago.push(detalle_liquidacion_pago);
        });

        DetalleLiquidacionPago.bulkCreate(detalles_liquidacion_pago, { validate: true, individualHooks: true })

        await t.commit();
        return res.status(201).json({ message: 'Registro de liquidación exitoso.' });
        
    }
    catch(error){
        console.error('Error al registrar la liquidación:', error);
        return res.status(500).json({ errors: 'Error al registrar la liquidación.' });
    }
}


module.exports = {
    getListadoLiquidacionesPendientes,
    getHistorialLiquidaciones,
    obtenerDetalleLiquidacionPendiente,
    obtenerDetalleLiquidacionHistorica,
    obtenerDatosRegistrarLiquidacion,
    registrarLiquidacion
}
