const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const personaRoutes = require('./routes/personaRoutes'); // Importar las rutas
const direccionRoutes = require('./routes/direccionRoutes'); // Importar las rutas
const estadoRoutes = require('./routes/estadoRoutes'); // Importar las rutas
const inmuebleRoutes = require('./routes/inmuebleRoutes'); // Importar las rutas
const inmueble_x_personaRoutes = require('./routes/inmueble_x_personaRoutes'); // Importar las rutas
const autenticacionRoute = require('./routes/autenticacionRoutes');
const monedasRoutes = require('./routes/monedaRoute');
const aptosRoutes = require('./routes/aptoRoutes');
const servicioRoutes = require('./routes/servicioRoute');
const alquilerRoutes = require('./routes/alquilerRoute');
const formaspagoRoutes = require('./routes/formaspagoRoute');
const alquilerpagoRoutes = require('./routes/pagoAlquilerRoute');
const liquidacionRoute = require('./routes/liquidacionRoute');
const ventaRoute = require('./routes/ventaRoute');
const cookieParser = require('cookie-parser');
const auth = require('./middlewares/autenticacion')
const CronController = require('./controllers/cronController');

const app = express();

const corsOptions = {
  origin: 'http://localhost:3000', // Solo permite solicitudes desde localhost:3000
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Permite solo los métodos GET ,POST y PUT
  allowedHeaders: ['Content-Type', 'Authorization'], // Permite solo el encabezado Content-Type
  credentials: true,
};

app.use(cookieParser());

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use('/autenticacion', autenticacionRoute)
app.use('/personas', auth, personaRoutes); // Usar las rutas importadas
app.use('/direcciones', auth, direccionRoutes); 
app.use('/estados', auth, estadoRoutes);
app.use('/inmuebles', auth, inmuebleRoutes);
app.use('/inmueblePersona', auth, inmueble_x_personaRoutes);
app.use('/aptos', auth, aptosRoutes);
app.use('/monedas', auth, monedasRoutes);
app.use('/servicios', auth, servicioRoutes);
app.use('/alquileres', auth, alquilerRoutes);
app.use('/formaspago', auth, formaspagoRoutes);
app.use('/pagoAlquiler', auth, alquilerpagoRoutes);
app.use('/liquidaciones', auth, liquidacionRoute);
app.use('/ventas', auth, ventaRoute);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
CronController.dailyTask();