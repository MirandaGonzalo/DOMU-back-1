const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Sequelize } = require('sequelize');
const sequelize = require('../../config/connection'); // Ajusta la ruta según la estructura de tu proyecto

// Inicializar los modelos
const Persona = require('./persona');
const Direccion = require('./direccion');
const Estado = require('./estado')
const Inmueble = require('./inmueble');
const PrecioInmueble = require('./precio_inmueble');
const LocalComercial = require('./localComercial')
const Vivienda = require('./vivienda')
const Casa = require('./casa');
const Departamento = require('./departamento');
const InmuebleXPersona = require('./inmueble_x_persona');
const Servicio = require('./servicio');
const DetalleServicio = require('./detalle_servicio');
const Moneda = require('./moneda');
const AptoPara = require('./apto_para');
const InmuebleXApto = require('./inmueble_x_apto');
const Alquiler = require('./alquiler');
const GastoFijo = require('./gasto_fijo');
const FormaDePago = require('./forma_de_pago');
const Garantia = require('./garantia');
const PagoAlquiler = require('./pago_alquiler');
const DetallePagoServicio = require('./detalle_pago_servicio');
const GastoExtra = require('./gasto_extra');
const PagoParcial = require('./pago_parcial');
const LiquidacionPropietario = require('./liquidacion_propietario');
const DetalleLiquidacionPago = require('./detalle_liquidacion_pago');
const Saldo = require('./saldo');
const Venta = require('./venta');
const VentaXPersona = require('./venta_x_persona');
//const Direccion = DireccionModel;


Persona.belongsTo(Direccion, { foreignKey: 'id_direccion', as: 'direccion' });
//Persona.belongsTo(Estado, { foreignKey: 'id_estado', as: 'estado' });
Persona.belongsTo(Estado, { foreignKey: 'id_estado', as: 'estado' });
Estado.hasMany(Persona, { foreignKey: 'id_estado' });

Inmueble.belongsTo(Direccion, { foreignKey: 'id_direccion', as: 'direccion' });
//Persona.belongsTo(Estado, { foreignKey: 'id_estado', as: 'estado' });
Inmueble.belongsTo(Estado, { foreignKey: 'id_estado', as: 'estado' });
Inmueble.belongsTo(Estado, { foreignKey: 'id_estado_anterior', as: 'estado_anterior' });
Estado.hasMany(Inmueble, { foreignKey: 'id_estado' });
Inmueble.hasOne(LocalComercial, { foreignKey: 'id_inmueble', as: 'local_comercial' });
Inmueble.hasOne(Vivienda, { foreignKey: 'id_inmueble', as: 'vivienda' });

Inmueble.hasMany(PrecioInmueble, { foreignKey: 'id_inmueble', as: 'PrecioInmueble' });

PrecioInmueble.belongsTo(Inmueble, { foreignKey: 'id_inmueble' });
PrecioInmueble.belongsTo(Moneda, { foreignKey: 'id_moneda', as: 'moneda' });

Moneda.hasMany(PrecioInmueble, { foreignKey: 'id_moneda' });



LocalComercial.belongsTo(Inmueble, { foreignKey: 'id_inmueble', as: 'inmueble' });

Vivienda.belongsTo(Inmueble, { foreignKey: 'id_inmueble', as: 'inmueble' });
Vivienda.hasOne(Casa, { foreignKey: 'id_vivienda', as: 'casa' });
Vivienda.hasOne(Departamento, { foreignKey: 'id_vivienda', as: 'departamento' });

Casa.belongsTo(Vivienda, { foreignKey: 'id_vivienda', as: 'vivienda' });

Departamento.belongsTo(Vivienda, { foreignKey: 'id_vivienda', as: 'vivienda' });

Persona.belongsToMany(Inmueble, { through: InmuebleXPersona, foreignKey: 'dni_persona' });
Inmueble.belongsToMany(Persona, { through: InmuebleXPersona, foreignKey: 'id_inmueble' });

Servicio.belongsToMany(Inmueble, { through: DetalleServicio, foreignKey: 'id_servicio' });
Inmueble.belongsToMany(Servicio, { through: DetalleServicio, foreignKey: 'id_inmueble' });

AptoPara.belongsToMany(Inmueble, { through: InmuebleXApto, foreignKey: 'id_apto' });
Inmueble.belongsToMany(AptoPara, { through: InmuebleXApto, foreignKey: 'id_inmueble' });


// -----------------------------Alquileres----------------------------------

Alquiler.belongsTo(Estado, { foreignKey: 'id_estado', as: 'estado' });
Estado.hasMany(Alquiler, { foreignKey: 'id_estado' });

Alquiler.belongsTo(Inmueble, { foreignKey: 'id_inmueble', as: 'inmueble' });
Inmueble.hasMany(Alquiler, { foreignKey: 'id_inmueble' });

Alquiler.belongsTo(Persona, { foreignKey: 'dni_inquilino', as: 'persona' });

Servicio.belongsToMany(Alquiler, { through: GastoFijo, foreignKey: 'id_servicio' });
Alquiler.belongsToMany(Servicio, { through: GastoFijo, foreignKey: 'id_alquiler' });
GastoFijo.belongsTo(Servicio, { foreignKey: 'id_servicio', as: 'servicio' })

Alquiler.belongsTo(Moneda, { foreignKey: 'id_moneda', as: 'moneda' });
Moneda.hasMany(Alquiler, { foreignKey: 'id_moneda' });

Alquiler.belongsTo(FormaDePago, { foreignKey: 'id_forma_de_pago', as: 'forma_de_pago' });
FormaDePago.hasMany(Alquiler, { foreignKey: 'id_forma_de_pago' });

Alquiler.hasMany(Garantia, { foreignKey: 'id_alquiler', as: 'garantias' });
Garantia.belongsTo(Alquiler, { foreignKey: 'id_alquiler' });

Garantia.belongsTo(Persona, { foreignKey: 'dni_responsable', as:'responsable' });
Persona.hasMany(Garantia, { foreignKey:'dni_responsable' });

Alquiler.belongsTo(Persona, { foreignKey: 'dni_propietario_principal', as: 'propietario_principal' });
Persona.hasMany(Alquiler, { foreignKey: 'dni_propietario_principal', as: 'alquileres' });

// ---------------------------Pago Alquileres-------------------------------

PagoAlquiler.belongsTo(Alquiler, { foreignKey: 'id_alquiler', as: 'alquiler'});
Alquiler.hasMany(PagoAlquiler, {  foreignKey: 'id_alquiler', as: 'pagos' });

PagoAlquiler.belongsTo(Estado, { foreignKey: 'id_estado', as: 'estado' });
Estado.hasMany(PagoAlquiler, { foreignKey: 'id_estado' });

PagoAlquiler.hasMany(DetallePagoServicio, { foreignKey: 'id_pago_alquiler', as: 'detalles_servicios' });
DetallePagoServicio.belongsTo(PagoAlquiler, { foreignKey: 'id_pago_alquiler' });

DetallePagoServicio.belongsTo(GastoFijo, { foreignKey: 'id_alquiler' , targetKey: 'id_alquiler'});
DetallePagoServicio.belongsTo(GastoFijo, { foreignKey: 'id_servicio', targetKey: 'id_servicio'});
GastoFijo.hasMany(DetallePagoServicio, { foreignKey: 'id_alquiler', sourceKey: 'id_alquiler'});
GastoFijo.hasMany(DetallePagoServicio, { foreignKey: 'id_servicio', sourceKey: 'id_servicio'});

PagoAlquiler.hasMany(GastoExtra, { foreignKey: 'id_pago_alquiler', as: 'gastos_extra' });
GastoExtra.belongsTo(PagoAlquiler, { foreignKey: 'id_pago_alquiler' });

// Pago Parcial
PagoAlquiler.hasMany(PagoParcial, { foreignKey: 'id_pago_alquiler', as: 'pagos_parciales' });
PagoParcial.belongsTo(PagoAlquiler, { foreignKey: 'id_pago_alquiler' });

PagoParcial.belongsTo(FormaDePago, { foreignKey: 'id_forma_de_pago', as: 'forma_de_pago' });
FormaDePago.hasMany(PagoParcial, { foreignKey: 'id_forma_de_pago' });

PagoParcial.hasMany(DetallePagoServicio, { foreignKey: 'id_pago_parcial' });
DetallePagoServicio.belongsTo(PagoParcial, { foreignKey: 'id_pago_parcial', as: 'pago_parcial' });

PagoParcial.hasMany(GastoExtra, { foreignKey: 'id_pago_parcial' });
GastoExtra.belongsTo(PagoParcial, { foreignKey: 'id_pago_parcial', as: 'pago_parcial' });

// -----------------------------Liquidaciones-------------------------------------
LiquidacionPropietario.belongsTo(Moneda, { foreignKey: 'id_moneda', as: 'moneda' });
Moneda.hasMany(LiquidacionPropietario, { foreignKey: 'id_moneda' });

LiquidacionPropietario.belongsTo(FormaDePago, { foreignKey: 'id_forma_de_pago', as: 'forma_de_pago' });
FormaDePago.hasMany(LiquidacionPropietario, { foreignKey: 'id_forma_de_pago' });

LiquidacionPropietario.belongsToMany(PagoAlquiler, { through: DetalleLiquidacionPago, foreignKey: 'id_liquidacion' });
PagoAlquiler.belongsToMany(LiquidacionPropietario, { through: DetalleLiquidacionPago, foreignKey: 'id_pago_alquiler' });

// ------------------------------------Saldo--------------------------------------
Saldo.belongsTo(PagoParcial, { foreignKey: 'id_pago_parcial_origen', as: 'pago_parcial_origen' });
Saldo.belongsTo(PagoParcial, { foreignKey: 'id_pago_parcial_cubierto', as: 'pago_parcial_cubierto' });

// ------------------------------------Ventas--------------------------------------
Venta.belongsTo(Inmueble, { foreignKey: 'id_inmueble', as: 'inmueble' });
Inmueble.hasMany(Venta, { foreignKey: 'id_inmueble' });

Venta.belongsTo(Persona, { foreignKey: 'dni_comprador', as: 'comprador' });
Persona.hasMany(Venta, { foreignKey: 'dni_comprador', as: 'ventas_comprador' });

Venta.belongsTo(Moneda, { foreignKey: 'id_moneda', as: 'moneda' });
Moneda.hasMany(Venta, { foreignKey: 'id_moneda' });

Venta.belongsTo(FormaDePago, { foreignKey: 'id_forma_de_pago', as: 'forma_de_pago' });
FormaDePago.hasMany(Venta, { foreignKey: 'id_forma_de_pago' });

Venta.belongsTo(Estado, { foreignKey: 'id_estado', as: 'estado' });
Estado.hasMany(Venta, { foreignKey: 'id_estado' });

Persona.belongsToMany(Venta, { through: VentaXPersona, foreignKey: 'dni_persona', as: 'ventas' });
Venta.belongsToMany(Persona, { through: VentaXPersona, foreignKey: 'id_venta', as: 'personas'} );

// Objeto para almacenar todos los modelos
const models = {
    Persona,
    Direccion,
    Estado,
    Inmueble,
    LocalComercial,
    Vivienda,
    Casa,
    Departamento,
    InmuebleXPersona,
    Servicio,
    DetalleServicio,
    Moneda,
    AptoPara,
    InmuebleXApto,
    PrecioInmueble,
    Alquiler,
    GastoFijo,
    Garantia,
    FormaDePago,
    PagoAlquiler,
    PagoParcial,
    DetallePagoServicio,
    GastoExtra,
    LiquidacionPropietario,
    DetalleLiquidacionPago,
    Saldo,
    Venta,
    VentaXPersona
};

sequelize.sync()
  .then(() => {
    console.log('Sincronización completa de modelos.');
  })
  .catch(err => {
    console.error('Error al sincronizar modelos:', err);
  });
  
module.exports = { sequelize, models };
