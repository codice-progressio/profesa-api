var colores = require('../utils/colors');

// Esta clase maneja todos los errores de manera que no tengamos que estar
// repitiendo todos y los mensajes que se dan atravez del response. 

// Solo es necesario pasar un objeto con msj, err.
// La comprobación de la existencia de error es aqui y así no saturamos el 
// controller de if comprobando el error.
// Si el {err: err} esta vacio nos manda directamente un 500 internal server error. 

// EJEMPLOS DE USO.
// 
//      ** Una respuesta normal con multiples datos. 
//       Parametros: (res, [{tipo, datos}])
//           res => El response del http.
//           tipo => El nombre del tipo de dato que se va a pasar. (Por ejemplo: empleados, usuario, etc)
//           datos => Los datos que iran dentro del tipo (tipo: datos )
//           msj => Un mensaje para mostrar la interfaz. Si no se define no se manda el atributo. 
//      RESP._200(res, msj,  [
//          { tipo: 'Empleados', datos: { array: 'objetos de empleado' } },
//          { tipo: 'Patronres', datos: { lista: 'objetos de patrón' } },
//      ]);


//      ** Una respuesta de error.
//      Parametros: (msj, err, masInfo[{infoAdicional, dataAdicional}])
//          res => El response del http.
//          msj => El mensaje que se mostrarán la interfaz
//          err => El error completo que genera la api
//          masInfo => Información adicional
//              infoAdicional => El titulo que le daremos al error adcional.
//              dataAdicional => La información extra que queremos pasar.
//      RESP._400(res, { msj: 'Algo salio muy mal', err: { errores: 'Objeto de error' } });

//      RESP._500(res, {
//          msj: 'Algo salio muy mal',
//          err: { errores: 'Objeto de error' },
//          masInfo: [
//              { infoAdicional: 'TipoError', dataAdicional: 'Chale mano!! De plano la regaste.' }
//          ]
//      });


// Cuando se estructura el error devuelve lo siguiente:

// {
//     "data": {
//         "ok": false,
//         "mensaje": "Hubo un problema grave",
//         "errorGeneral": {**error general completo**},
//         "erroresInterfaz": ['Mensajes para mostrar en la interfaz']
//     }
// }

// Cuando la petición es correcta

const resp = {};


// Estos parametros se jalan desde 
// el middleware para los errores. 
// No los quites XO.
function generalError(dat) {

    var data = {
        ok: false,
        mensaje: dat.msj,
        errorGeneral: dat.err,
    };

    if (dat.masInfo) {
        data.masInfo = [];
        dat.masInfo.forEach(d => {
            data.masInfo.push(d);
        });
    }

    if (dat.err.hasOwnProperty('err')) {
        data.erroresInterfaz = [];

        for (let campo in dat.err.errors) {
            data.erroresInterfaz.push(dat.err.errors[campo].message);
        }
    }
    console.log(colores.danger('ERROR') + data.mensaje);
    // DEJA ESTO AQUÍ. 
    console.log(data.errorGeneral);
    return { data };
}

function generalStatusOk(data) {
    var data2 = {
        ok: true,
        mensaje: data.mensaje
    };
    data.forEach(d => {
        data2[d.tipo] = d.datos;
    });
    return data2;
}

resp.errorGeneral = (datos) => {
    if (datos.err) {
        return generalError(datos);
    }
};

//Modelo de errores. 
resp._400 = (res, datos) => {
    if (datos.err) {
        // logError(datos);
        return res.status(400).json(generalError(datos));
    }
};
//Modelo de errores. 
resp._401 = (res, datos) => {
    if (datos.err) {
        // logError(datos);
        return res.status(401).json(generalError(datos));
    }
};
resp._404 = (res, datos) => {
    if (datos.err) {
        // logError(datos);
        return res.status(404).json(generalError(datos));
    }
};

resp._500 = (res, datos) => {
    if (datos.err) {
        // logError(datos);
        return res.status(500).json(generalError(datos));
    } else {
        console.log(colores.danger('ERROR') + datos);
        console.log(datos);
        return res.status(500).json(datos);
    }
};
resp._500_Send = (res, datos) => {
    if (datos.err) {
        // logError(datos);
        return res.status(500).send(generalError(datos));
    }
};



//Modelo de mensajes. 
resp._200 = (res, msj, datos) => {
    if (!res) {
        // El response no puede estar vacio por que
        // de aquí se genera la respuesta. 
        throw 'El response esta vacio. ';
    }
    if (msj) {
        datos.mensaje = msj;
    }
    return res.status(200).json(generalStatusOk(datos));
};

module.exports = resp;