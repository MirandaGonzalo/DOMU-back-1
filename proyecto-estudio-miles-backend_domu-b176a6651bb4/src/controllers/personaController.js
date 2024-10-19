const mariadb = require('mariadb')
const config = require("../../config/mariadb")
const gestor_direcciones = require('./direccionController')
const gestor_estados = require('./estadoController')
const { RegistrarPersonaSchema, PersonaSchema, PersonaEstadoSchema } = require('../validators/personaValidator');
const { direccionSchema, direccionUpdateSchema } = require('../validators/direccionValidator');
const { Sequelize , Op} = require('sequelize');
const sequelize = require('../../config/connection'); 
const { models } = require('../models/index');
const Estado = require('../models/estado');
const { convertirVaciosAUndefined, convertirUndefinedAVacios, verificarCambios, extraerDireccion, validarSchema } = require('../utilities/functions');
const Alquiler = require('../models/alquiler');
const Inmueble = require('../models/inmueble');
const InmuebleXPersona = require('../models/inmueble_x_persona');
const EstadoController = require('../controllers/estadoController');

const Persona = models.Persona;
const Direccion = models.Direccion;

const extraerPersona = (data) => {
    const { dni, nombre, cuit, celular, celular_secundario, cuenta_banco, condicion_iva, observacion, email, ocupacion } = data;
    return { dni, nombre, cuit, celular, celular_secundario, cuenta_banco, condicion_iva, observacion,  email, ocupacion };
    
}

const getPersonas = async (req, res) => {
    try {
        // Verifica el estado de la conexión antes de proceder
        await sequelize.authenticate();

        const personas = await Persona.findAll({
            include: [{
              model: Estado,
              as: 'estado' // Este alias debe coincidir con la asociación definida
            }]
          });

        return res.json(personas);
    } catch (error) {
        console.error('Error al obtener las personas:', error);
        // Manejo del error y envío de una respuesta de error al cliente
        return res.status(500).json({ errors: 'Error al obtener las personas.' });
    }
};

const registrarPersona = async (req, res) => {

    await sequelize.authenticate();

    const t = await sequelize.transaction();

     try {
        // Convertir campos vacíos a undefined
        convertirVaciosAUndefined(req.body);

        // Extraer datos de persona del cuerpo de la solicitud y juntarlos
        const nueva = extraerPersona(req.body);
        nueva.id_estado = await gestor_estados.obtenerIdEstadoActivoGeneral();

        // Validar los datos recibidos usando Joi
        const { error: personaError, value: personaValue } = RegistrarPersonaSchema.validate(nueva, { abortEarly: false });

        if (personaError) {
            await t.rollback();
            const errorMessage = personaError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessage });
        }

        const direccion = extraerDireccion(req.body);

        const { error: direccionError, value: direccionValue } = direccionSchema.validate(direccion, { abortEarly: false });
        
        if (direccionError) {
            await t.rollback();
            const errorMessages = direccionError.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessages });
        }

        let persona_encontrada = await Persona.findByPk(nueva.dni, { transaction: t });
        
        if (persona_encontrada) {
            await t.rollback();
            return res.status(409).json({ errors: 'Ya existe una persona con ese DNI.' });
        } 
        else {
            
            const id_direccion = await gestor_direcciones.agregar(direccion, t);
            nueva.id_direccion = id_direccion;

            await Persona.create(nueva, { transaction: t });
            await t.commit();

            return res.status(201).json({ message: 'Registro de Persona exitoso.' });
        }
        
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
        return res.status(500).json({ errors: 'Error al registrar la persona.' });
    }
};

const modificarPersona = async (req, res) => {

    await sequelize.authenticate();
    const t = await sequelize.transaction(); // Iniciar una transacción

    // Convertir campos vacíos a undefined
    convertirVaciosAUndefined(req.body);

    // Extraer datos de persona del cuerpo de la solicitud y juntarlos
    const personaData = extraerPersona(req.body);

    // Validar los datos recibidos usando Joi
    const { error: personaError, value: personaValue } = PersonaSchema.validate(personaData, { abortEarly: false });

    if (personaError) {
        await t.rollback();
        const errorMessages = personaError.details.map(detail => detail.message);
        return res.status(400).json({ errors: errorMessages });
    }

    let dniModificar  = parseInt(req.body.dni);// Obtener el DNI desde los parámetros de la solicitud

    // Extraer datos de dirección del cuerpo de la solicitud y juntarlos
    const direccionData = extraerDireccion(req.body);

    let direccionValue = null;

    const { error: direccionError, value: direccionValidated } = direccionUpdateSchema.validate(direccionData, { abortEarly: false });
    if (direccionError) {
        await t.rollback();
        const errorMessages = direccionError.details.map(detail => detail.message);
        return res.status(400).json({ errors: errorMessages });
    }

    direccionValue = direccionValidated;

    try {

        // Buscar la persona por su DNI
        const persona = await Persona.findByPk(dniModificar, { transaction: t });
  
        // Si la persona no existe, devolver un error 404
        if (!persona) {
            await t.rollback();
            return res.status(404).json({ errors: 'Persona no encontrada.' });
        }
  
        // Convertir campos undefined a ''
        convertirUndefinedAVacios(personaValue);

        // Verificar si hay cambios en los datos de persona
        const personaChanges = verificarCambios(persona, personaValue);

        // Si hay cambios en la dirección, verificar si la dirección existe
        let direccionChanges = {};
        let direccion = {};

        if (direccionValue) {

            let id_dir  = parseInt(persona.id_direccion);

            direccion = await Direccion.findByPk(id_dir);

            if (!direccion) {
                await t.rollback();
                return res.status(404).json({ errors: 'Dirección no encontrada' });
            }

            // Convertir campos undefined a ''
            convertirUndefinedAVacios(direccionValue);

            // Verificar si hay cambios en los datos de dirección
            direccionChanges = verificarCambios(direccion, direccionValue);

        }

        if (Object.keys(personaChanges).length === 0 && Object.keys(direccionChanges).length === 0) {
            return res.status(200).json({ message: 'No hay cambios para actualizar.' });
        }

        // Actualizar la persona
        if (Object.keys(personaChanges).length > 0) {
            await persona.update(personaChanges, { transaction: t });
        }

        // Actualizar la dirección si hay cambios
        if (Object.keys(direccionChanges).length > 0) {
            await direccion.update(direccionChanges, { transaction: t });
        }
        
        // Confirmar la transacción
        await t.commit();

        res.status(200).json({ message: 'Actualización exitosa.' });

      } catch (error) {
          await t.rollback(); // Deshacer la transacción en caso de error
          return res.status(500).json({ errors: 'Error al modificar la persona.' });
      }
};

const modificarEstadoPersona = async (req, res) => {

  await sequelize.authenticate();
  const t = await sequelize.transaction(); // Iniciar una transacción

  // Obtener el DNI desde los parámetros de la solicitud
  let dni  = parseInt(req.body.dni);

  // Junto los datos de persona
  const personaData = { dni };

  // Validar los datos recibidos usando Joi
  const { error: personaError, value: personaValue } = PersonaEstadoSchema.validate(personaData, { abortEarly: false });

  if (personaError) {
      await t.rollback();
      const errorMessages = personaError.details.map(detail => detail.message);
      return res.status(400).json({ errors: errorMessages });
  }

  try {
      // Buscar la persona por su DNI
      const persona = await Persona.findByPk(dni, {
        include: {
          model: Estado,
          as: 'estado' // Alias opcional si lo definiste en la asociación
        }
      });

      // Si la persona no existe, devolver un error 404
      if (!persona) {
          await t.rollback();
          return res.status(404).json({ errors: 'Persona no encontrada.' });
      }

      const { nombre: nombreEstadoPersonaActual, tipo: tipoEstadoPersonaActual } = persona.estado;
      let nuevoValor = -1

      if ((nombreEstadoPersonaActual == "Activo" || nombreEstadoPersonaActual == "Inactivo") && tipoEstadoPersonaActual == "General"){
          nuevoValor = (nombreEstadoPersonaActual == "Activo" 
            ? await gestor_estados.obtenerIdEstadoInactivoGeneral() 
            : await gestor_estados.obtenerIdEstadoActivoGeneral());
      } 
      else {
          await t.rollback();
          return res.status(404).json({ errors: 'Persona con estado erróneo.' });
      }
      
      if (nuevoValor == -1 || isNaN(nuevoValor)){
          await t.rollback(); // Deshacer la transacción en caso de error
          return res.status(500).json({ errors: 'Error al modificar la persona.' });
      }

      const nuevoEstado = await Estado.findByPk(nuevoValor);

      if ((nuevoEstado.nombre == "Activo" || nuevoEstado.nombre == "Inactivo") && nuevoEstado.tipo == "General"){
          await Persona.update({ id_estado: nuevoValor }, {
            where: { dni: dni },
            transaction: t
          });
      
          // Confirmar la transacción
          await t.commit();
    
          res.status(200).json({ message: `Estado de ${persona.apellido} ${persona.nombre} actualizado a: ${nuevoEstado.nombre}` });
      }
      else{
          await t.rollback();
          return res.status(404).json({ errors: 'Persona con estado erróneo.' });
      }

  } catch (error) {
      await t.rollback(); // Deshacer la transacción en caso de error
      return res.status(500).json({ errors: 'Error al modificar la persona.'});
  }
};

const obtenerPersona = async (req, res) => {
    const { dni } = req.params;
  
    // Validar que el DNI sea un número entero
    if (!Number.isInteger(Number(dni))) {
        return res.status(400).json({ errors: 'El DNI debe ser un número entero válido.' });
    }
  
    try {
      // Utilizar Sequelize para buscar por el DNI
      const persona = await Persona.findOne({
        where: {
          dni: dni
        }
      });
  
      if (!persona) {
          return res.status(404).json({ errors: 'Persona no encontrada.' });
      }
  
      res.status(200).json(persona);
    } catch (error) {
      console.error('Error al obtener la persona por DNI:', error);
      res.status(500).json({ errors: 'Error al obtener la persona por DNI' });
    }
};

const obtenerDetallePersona = async (req, res) => {
    const { dni } = req.params;
  
    // Validar que el ID sea un número entero
    if (!Number.isInteger(Number(dni))) {
      return res.status(400).json({ errors: 'El DNI debe ser un número entero válido.' });
    }
  
    try {
      // Utilizar Sequelize para buscar la persona por ID junto con los datos de dirección
      
      const persona = await Persona.findByPk(dni, {
        include: [
            {
                model: Direccion,
                as: 'direccion' // Alias opcional si lo definiste en la asociación
            },
            {
                model: Estado,
                as: 'estado'
            }
        ]
      });

      if (!persona) {
        return res.status(404).json({ errors: 'Persona no encontrada.' });
      }
  
      res.status(200).json(persona);

    } catch (error) {
        console.error('Error al obtener la persona con dirección por DNI:', error);
        res.status(500).json({ errors: 'Error al obtener la persona junto con su dirección por DNI.' });
    }
};

const getPersonasActivasSimple = async (req, res) => {
  try {
      // Verifica el estado de la conexión antes de proceder
      await sequelize.authenticate();

      const personas = await Persona.findAll(
        {
          attributes: ['dni', 'nombre'],
          include: [{
            model: Estado,
            as: 'estado', // Este alias debe coincidir con la asociación definida
            where: { nombre: 'Activo' }, // Condición para filtrar por estado activo
            attributes: [] // excluir datos de estado
          }]
        });

      return res.json(personas);
      
  } catch (error) {
      console.error('Error al obtener las personas:', error);
      // Manejo del error y envío de una respuesta de error al cliente
      return res.status(500).json({ errors: 'Error al obtener las personas.' });
  }
};

const validarPersona = async (dni) => {
    try {
        // Validar que el ID sea un número entero
        if (!Number.isInteger(Number(dni))) {
            return { valid: false, message: 'El DNI de Persona debe ser un número entero.' };
        }
        const personaSel = await Persona.findByPk(dni);
        if (!personaSel) {
            return { valid: false, message: 'La Persona seleccionada no existe.' };
        }
        return { valid: true };
    } catch (err) {
        return { valid: false, message: 'Error al validar la Persona' };
    }
};

const obtenerPersonasNoPropietarias = async (req, res) => {
    const {id_inmueble} = req.params;
    if (!Number.isInteger(Number(id_inmueble))) {
        return res.status(400).json({ errors: 'El ID del Inmueble debe ser un número entero válido.' });
    }
    try {
        const inmueble = await Inmueble.findByPk(id_inmueble);
        if (!inmueble){
            t.rollback();
            return res.status(404).json({ errors: 'El Inmueble no existe.' });
        }
        // Utilizar Sequelize para buscar el alquiler por ID   
        const propietarios = await InmuebleXPersona.findAll({
            attributes: ['dni_persona'],
            where:{
                id_inmueble: inmueble.id
            }
        });
        if (!propietarios) {
            return res.status(404).json({ errors: 'Inmueble no encontrado.' });
        }
        const dnis_propietarios = [];
        propietarios.forEach(propietario => {
            dnis_propietarios.push(propietario.dni_persona);
        });
        const id_estado_activo = await EstadoController.obtenerIdEstadoPorParametro('Activo', 'General');
        const personas = await Persona.findAll({
            attributes: ['dni', 'nombre'],
            where: {
                dni: {
                    [Op.notIn] : dnis_propietarios,
                },
                id_estado: id_estado_activo
            }
        })

        personas.forEach(persona => {
            persona.nombre_dni = `${persona.nombre} - ${persona.dni}`;
        });

        res.status(200).json(personas);
    }
    catch(error){
        res.status(500).json({ errors: 'Error al obtener las personas posibles.' });
    }
}

module.exports = {
    getPersonas,
    modificarPersona,
    modificarEstadoPersona,
    obtenerPersona,
    obtenerDetallePersona,
    registrarPersona,
    getPersonasActivasSimple,
    validarPersona,
    obtenerPersonasNoPropietarias
};