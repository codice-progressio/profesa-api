var jwt = require('jsonwebtoken');
var SEED = require('../config/config').SEED;

// ============================================
// Verificar token.
// ============================================
exports.verificarToken = function(req, res, next) {

    var token = req.query.token;
    jwt.verify(token, SEED, (err, decode) => {

        if (err) {
            return res.status(401).json({
                ok: true,
                mensaje: 'Token incorrecto.',
                errors: err
            });
        }

        // Colocar la información del usuario en 
        // cualquier petición. Lo extraemos del decode.
        req.usuario = decode.usuario;


        next();

    });
};

// ============================================
// Verificar ADMIN.
// ============================================
exports.verificarADMIN_ROLE = function(req, res, next) {

    var usuario = req.usuario;
    if (usuario.role === 'ADMIN_ROLE') {
        next();
        return;
    } else {
        return RESP._401(res, {
            msj: 'Token incorrecto --Quitar | No es admin - ni mismo usuario.',
            err: 'No es administrador, no puede hacer eso.',
        });
    }
};


// ============================================
// Verificar ADMIN o Mismo USuario
// ============================================
exports.verificarADMIN_o_MismoUsuario = function(req, res, next) {

    var usuario = req.usuario;
    //Este tiene que vernid de la petición que se recive, 
    // en este caso la vamos a recivir desde el put. 
    var id = req.params.id;
    if (usuario.role === 'ADMIN_ROLE' || usuario._id === id) {
        next();
        return;
    } else {
        return RESP._401(res, {
            msj: 'Token incorrecto --Quitar | No es admin - ni mismo usuario.',
            err: 'No eres administrador, no puedes hacer eso.',
        });

    }
};

exports.verificarNoCambioDeADMIN_ROLE = function(req, res, next) {

    var usuario = req.usuario;
    var roleNuevo = req.body.role;

    if (usuario.role === 'ADMIN_ROLE') {
        // Esta comprobación no es necesaria cuando es el administrador. 
        next();
        return;
    }

    if (usuario.role === 'USER_ROLE' && roleNuevo === usuario.role) {
        next();
        return;
    } else {
        return RESP._401(res, {
            msj: 'Token incorrecto --Quitar | No es admin - ni mismo usuario.',
            err: 'No puedes cambiar tu role, comunicate con un administrador.',
        });
    }
};