const sequelize = require('../../config/connection'); 
const transporter = require('../../config/notis'); 
const { models } = require('../models/index');
const { Op } = require("sequelize");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const Alquiler = require('../models/alquiler');
const Inmueble = require('../models/inmueble');
const Persona = require('../models/persona');
const Estado = require('../models/estado');
const PagoAlquilerController = require('../controllers/pagoAlquilerController');
const EstadoController = require('../controllers/estadoController');
const PagoAlquiler = require('../models/pago_alquiler');

const finalizarAlquileres = async () => {
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow = tomorrow.toISOString().split('T')[0];
    await sequelize.authenticate();
    const t = await sequelize.transaction();
    const id_estado = await EstadoController.obtenerIdEstadoPorParametro('Vigente', 'Alquiler');
    const id_estado_finalizado = await EstadoController.obtenerIdEstadoPorParametro('Finalizado', 'Alquiler');
    const id_estado_finalizado_pagos_pendientes = await EstadoController.obtenerIdEstadoPorParametro('Finalizado pendiente de pagos', 'Alquiler');
    //Acá pregunto si quedán deudas (quedo pendiente de pagar algún alquiler, servicio o lo que sea).
    try{
        const alquileresFinalizar = await Alquiler.findAll({
            where: {
                fecha_fin_contrato: tomorrow,
                id_estado: id_estado
            }
        })
        if (!alquileresFinalizar || Object.keys(alquileresFinalizar).length == 0){
            await t.commit();
            return;
        }
        //Finalizo los contratos - cambiando su estado.
        await Promise.all(alquileresFinalizar.map(async (alquiler) => {
            //Cambio el estado del Alquiler
            const poseeDeuda = await PagoAlquilerController.poseePagosPendientes(alquiler.id);
            const estado_nuevo = (poseeDeuda ? id_estado_finalizado_pagos_pendientes : id_estado_finalizado)
            const updateAlquiler = {
                id_estado: estado_nuevo
            }
            const inmuebleAlquiler = await Inmueble.findByPk(alquiler.id_inmueble);
            if (!inmuebleAlquiler){
                await t.rollback();
                return res.status(400).json({ errors: 'El Alquiler seleccionado no posee un Inmueble.'});
            }
            const idEstadoActivo = await EstadoController.obtenerIdEstadoActivoGeneral();
            const updateInmueble = {
                id_estado_anterior: inmuebleAlquiler.id_estado,
                id_estado: idEstadoActivo
            }
            let alquilerSel = await Alquiler.findOne({
                where: {
                    id: alquiler.id
                }
            })
            await inmuebleAlquiler.update(updateInmueble);
            await alquilerSel.update(updateAlquiler);
        }));
        await t.commit();
        console.log('Alquileres finalizados con correctamente.')
    }
    catch(error){
        if (!t.finished) await t.rollback();
        console.error('Error al finalizar alquileres:', error);
    }
  };
  
const iniciarAlquileres = async (req, res) => {
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow = tomorrow.toISOString().split('T')[0];
    await sequelize.authenticate();
    const t = await sequelize.transaction();
    const id_estado = await EstadoController.obtenerIdEstadoPorParametro('Por Iniciar', 'Alquiler');
    const id_estado_vigente = await EstadoController.obtenerIdEstadoPorParametro('Vigente', 'Alquiler');
    //Acá pregunto si quedán deudas (quedo pendiente de pagar algún alquiler, servicio o lo que sea).
    try{
        const alquileresIniciar = await Alquiler.findAll({
            where: {
                fecha_inicio_contrato: tomorrow,
                id_estado: id_estado
            }
        })
        if (!alquileresIniciar || Object.keys(alquileresIniciar).length == 0){
            console.log('No se encontraron alquileres para iniciar.');
            await t.commit();
            return;
        }
        //Inicio los contratos - cambiando su estado.
        await Promise.all(alquileresIniciar.map(async (alquiler) => {
            //Cambio el estado del Alquiler
            const updateAlquiler = {
                id_estado: id_estado_vigente
            }
            const inmuebleAlquiler = await Inmueble.findByPk(alquiler.id_inmueble);
            if (!inmuebleAlquiler){
                await t.rollback();
                return res.status(400).json({ errors: 'El Alquiler seleccionado no posee un Inmueble.'});
            }
            const idEstadoAlquilado = await EstadoController.obtenerIdEstadoPorParametro('Alquilado','Inmueble');
            const updateInmueble = {
                id_estado_anterior: inmuebleAlquiler.id_estado,
                id_estado: idEstadoAlquilado
            }
            let alquilerSel = await Alquiler.findOne({
                where: {
                    id: alquiler.id
                }
            })
            await inmuebleAlquiler.update(updateInmueble);
            await alquilerSel.update(updateAlquiler);
        }));
        await t.commit();
        console.log('Alquileres iniciados correctamente.');
    }
    catch(error){
        if (!t.finished) await t.rollback();
        console.error('Error al iniciar alquileres:', error);
    }
  };
  
const notificarDisponibilidadPagoAlquiler = async() => {
    var mailOptions = {
        from: process.env.EMAIL_ACCOUNT,
        to: 'gonzamirandab2000@gmail.com',
        subject: 'Sending Email using Node.js',
        text: 'That was easy!'
    };
    /*
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
    });
    */
};

const notificacionFinContrato = async (req, res) => {
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 180);
    tomorrow = tomorrow.toISOString().split('T')[0];
    await sequelize.authenticate();
    const t = await sequelize.transaction();
    const id_estado_vigente = await EstadoController.obtenerIdEstadoPorParametro('Vigente', 'Alquiler');
    //Acá pregunto si quedán deudas (quedo pendiente de pagar algún alquiler, servicio o lo que sea).
    try{
        const alquileresFinalizar = await Alquiler.findAll({
            where: {
                fecha_fin_contrato: tomorrow,
                id_estado: id_estado_vigente
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
                            attributes: ['dni', 'nombre', 'email'],
                            through: { attributes: [] },
                            as: 'Personas'
                        },
                        {
                            model: models.Direccion,
                            attributes: ['numero', 'calle', 'barrio', 'localidad', 'provincia'],
                            as: 'direccion'
                        }
                    ]
                },
                {
                    model: models.Persona,
                    attributes: ['dni', 'nombre', 'email'],
                    as: 'persona'
                }
            ]
        })
        if (!alquileresFinalizar || Object.keys(alquileresFinalizar).length == 0){
            console.log('No se encontraron alquileres para notificar su finalización.');
            await t.commit();
            return;
        }
        //Notifico al inquilino y al propietario de la finalización de contrato.
        for (const alquiler of alquileresFinalizar) {
            let direccionInmueble = `${alquiler.inmueble.direccion.calle} ${alquiler.inmueble.direccion.numero} - ${alquiler.inmueble.direccion.barrio}, ${alquiler.inmueble.direccion.localidad}`;
            //Primero envíamos al Inquilino
            let asunto = "Aviso de Próxima Finalización de Contrato de Alquiler";
            let destinatario = alquiler.persona.email;
            let texto = `<p>Estimado/a <strong>${alquiler.persona.nombre}</strong>,</p>
        <p>Nos comunicamos desde la inmobiliaria <strong>Miles</strong> para informarle que el contrato de alquiler del inmueble de su propiedad, ubicado en <strong>${direccionInmueble}</strong>, finalizará en aproximadamente <strong>180 días</strong>.</p>
        <p>Le recomendamos ponerse en contacto con nosotros para coordinar los pasos a seguir y discutir cualquier acción que desee tomar respecto al futuro del inmueble.</p>
        <p>Estamos a su disposición para resolver cualquier consulta o brindarle mayor información. Puede contactarnos respondiendo a este correo o llamándonos al <strong>[Número de Teléfono de la Inmobiliaria]</strong>, de lunes a viernes en el horario de <strong>[Horario de Atención]</strong>.</p>
        <p>Gracias por su atención, quedamos a la espera de su respuesta.</p>
        <p>Atentamente,</p>
        <p><strong>Joaquín Miles</strong><br>
        <strong>Estudio Miles</strong><br>
        [Teléfono]<br>
        [Correo electrónico]<br>
        [Dirección de la Oficina]</p> `
            var mailOptions = {
                from: process.env.EMAIL_ACCOUNT,
                //to: destinatario,
                to: 'obviamenteestoy@gmail.com',
                subject: asunto,
                html: texto
            };
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
            });
        }
        
        await t.commit();
        console.log('Notificaciones de fin de contrato enviadas correctamente.');
    }
    catch(error){
        if (!t.finished) await t.rollback();
        console.error('Error al enviar notificaciones de fin de contrato:', error);
    }
}

module.exports = {
    finalizarAlquileres,
    iniciarAlquileres,
    notificarDisponibilidadPagoAlquiler,
    notificacionFinContrato
};