const cron = require('node-cron');
const { finalizarAlquileres, iniciarAlquileres, notificarDisponibilidadPagoAlquiler, notificacionFinContrato } = require('../services/cronServices');

const CronController = {
  // Definir un cron job que corre todos los días a las 11:50 PM
  dailyTask: () => {
    cron.schedule('50 23 * * *', async () => {
      console.log('Ejecutando la tarea diaria: Finalizar alquileres');
      try {
        await finalizarAlquileres();
        console.log('Finalización de alquileres completada.');
      } catch (error) {
        console.error('Error al finalizar alquileres:', error);
      }

      console.log('Ejecutando la tarea diaria: Iniciar alquileres');
      try {
        await iniciarAlquileres();
        console.log('Inicio de alquileres completado.');
      } catch (error) {
        console.error('Error al iniciar alquileres:', error);
      }
    }),
    cron.schedule('25 23 * * *', async () => {
      console.log('Ejecutando la tarea diaria: Enviar email');
      try {
        await notificacionFinContrato();
        console.log('Test.');
      } catch (error) {
        console.error('Error al test:', error);
      }
    })
  },

};

module.exports = CronController;