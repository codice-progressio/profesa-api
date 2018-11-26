var RESP = require('../utils/respStatus');
var _CONST = require('../utils/constantes');
var jwt = require('jsonwebtoken');
var SEED = require('../config/config').SEED;
// Este modulo se encarga de administrar los permisos
// de los usuarios para permitir la ejecución o no de las rutas. 

function token(req, res, next) {

    var token = req.query.token;
    jwt.verify(token, SEED, (err, decode) => {

        if (err) {
            return RESP._401(res, {
                msj: 'Token incorrecto.',
                err: 'El token recivido no es válido.',
            });
        }

        // Colocar la información del usuario en 
        // cualquier petición. Lo extraemos del decode.
        req.usuario = decode.usuario;
        next();
    });
};

exports.PERMISOS = function(ROLES_REQUERIDOS) {
    console.log('Esta comprobando los permisos. ');
    return [token, function(req, res, next) {



        console.log('Dentro del request ');
        const USUARIO_LOGUEADO = req.usuario;
        const PERMISOS_DE_USUARIO = USUARIO_LOGUEADO.role;

        console.log('Dentro del request 2');
        // Si es super-admin no hace la comprobación. 
        if (PERMISOS_DE_USUARIO.includes(_CONST.ROLES.SUPER_ADMIN)) {
            next();
        } else {

            console.log('Dentro del request 3');
            // Comprobamos que el usuario tenga todos los permisos
            //  que son necesarios.
            ROLES_REQUERIDOS.forEach(role => {
                console.log('Dentro del request 4');
                if (!PERMISOS_DE_USUARIO.includes(role)) {
                    console.log('Dentro del request 5');
                    return RESP._401(res, {
                        msj: 'No tienes los permisos necesarios para esta petición.',
                        err: 'ROLES REQUERIDOS : ' + ROLES_REQUERIDOS,
                        autorizado: false
                    });
                }
            });
            console.log('Dentro del request 7');
            next();
        };

    }];

};