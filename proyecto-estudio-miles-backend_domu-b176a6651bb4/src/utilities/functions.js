
// Convertir campos vacíos a undefined
const convertirVaciosAUndefined = (body) => {

    Object.keys(body).forEach(key => {
        if (body[key] === '' || body[key] === "" || body[key] === null) {
          body[key] = undefined;
        }
    });
}

// Convertir campos undefined a ''
const convertirUndefinedAVacios = (value) => {

    Object.keys(value).forEach(key => {
        if (value[key] == undefined) {
            value[key] = null;
        }
    });
}

const verificarCambios = (actual, nuevo) => {

    const cambios = {};

    for (const key in nuevo) {
        if (actual[key] !== nuevo[key]) {
            cambios[key] = nuevo[key];
        }
    }

    return cambios;
}

const extraerDireccion = (data) => {
    const { numero, calle, barrio, localidad, provincia, piso, departamento, codigo_postal } = data;
    return { numero, calle, barrio, localidad, provincia, piso, departamento, codigo_postal };
};

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

const convertirDateADateOnly = (fecha) => {
    let year = fecha.getFullYear();
    let month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    let day = fecha.getDate().toString().padStart(2, '0');

    // Formato 'YYYY-MM-DD' compatible con DATEONLY
    return `${year}-${month}-${day}`;
}

const convertirFechaAIso = async (fecha, t, res, mensajeError) => {
    try {
        const date = new Date(fecha);
        
        if (isNaN(date.getTime())) {
            await t.rollback();
            return res.status(400).json({ errors: mensajeError });
        }

        return date.toISOString();
    } catch (error) {
        await t.rollback();
        res.status(400).json({ errors: mensajeError });
    }
};

const concatenarMontoYMoneda = (monto, moneda) => {
    return `${moneda.descripcion} (${moneda.nombre}) ${monto}`;
}

module.exports = {
    convertirVaciosAUndefined,
    convertirUndefinedAVacios,
    verificarCambios,
    extraerDireccion,
    obtenerTipoInmueble,
    convertirDateADateOnly,
    convertirFechaAIso,
    concatenarMontoYMoneda
}