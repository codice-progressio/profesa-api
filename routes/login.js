var express = require('express');
var app = express();

// Requires
var colores = require('../utils/colors');
var bcrypt = require('bcryptjs');
var Usuario = require('../models/usuario');
var jwt = require('jsonwebtoken');
var SEED = require('../config/config').SEED;


// Google
var CLIENT_ID = require('../config/config').CLIENTE_ID;
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

var mdAutenticacion = require('../middlewares/autenticacion');

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });

    const payload = ticket.getPayload();
    // const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];

    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true,
        // payload: payload


    };
}

// ============================================
// Autenticación de google. 
// ============================================

app.get('/renuevatoken', mdAutenticacion.verificarToken, (req, res) => {

    var token = jwt.sign({ usuario: req.usuario }, SEED, { expiresIn: 14400 });

    return res.status(200).send({
        ok: true,
        token: token
    });
});

// ============================================
// Autenticación de google. 
// ============================================

app.post('/google', async(req, res) => {

    var token = req.body.token || 'NO TOKEN';

    var googleUser;
    try {
        googleUser = await verify(token);
    } catch (error) {
        return res.status(403).send({
            ok: false,
            mensaje: 'Token no válida',
            error: error.message
        });
    }


    Usuario.findOne({ email: googleUser.email }, (err, usuarioDB) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                mensaje: 'Error al buscar usuario',
                error: err
            });
        }

        if (usuarioDB) {
            if (usuarioDB === false) {
                return res.status(400).send({
                    ok: false,
                    mensaje: 'Debe de usar su autenticación normal',
                    error: error.message
                });
            } else {
                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 });

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB.id,
                    menu: obtenerMenu(usuarioDB.role)
                });
            }
        } else {
            // El usuario no existe. Hay que crearlo.
            var usuario = new Usuario();
            usuario.nombre = googleUser.nombre;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true;
            usuario.password = ':D';

            usuario.save((err, usuarioDB) => {
                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 });

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB.id,
                    menu: obtenerMenu(usuarioDB.role)
                });
            });
        }
    });

    // return res.status(200).send({
    //     ok: true,
    //     mensaje: 'todo Ok!!',
    //     googleUser: googleUser
    // });
});


// ============================================
// Login propietario de la app.
// ============================================

app.post('/', (req, res) => {

    var body = req.body;

    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario.',
                errors: err

            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - email.',
                errors: err
            });
        }
        if (!body.password) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Password no debe estar vacio - password.',
                errors: err
            });

        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - password.',
                errors: err
            });
        }

        // crear un token!
        usuarioDB.password = ':D';
        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 });

        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB.id,
            menu: obtenerMenu(usuarioDB.role)
        });
    });

});

function obtenerMenu(ROLE) {

    var menu = [{
            titulo: 'Principal',
            icono: 'mdi mdi-gauge',
            submenu: [
                { titulo: 'Dashboard', url: '/dashboard' },
                { titulo: 'ProgressBar', url: '/progress' },
                { titulo: 'Gráficas', url: '/graficas1' },
                // { titulo: 'Promesas', url: '/promesas' },
                // { titulo: 'rxjs', url: '/rxjs' },
            ]
        },
        // {
        //     titulo: 'Administrador',
        //     icono: 'fa fa-gears',
        //     submenu: [
        //         // // { titulo: 'Usuarios', url: '/usuarios' },
        //         // { titulo: 'Hospitales', url: '/hospitales' },
        //         // { titulo: 'Médicos', url: '/medicos' },
        //     ]
        // },
        {
            titulo: 'Control de Producción',
            icono: 'mdi mdi-gauge',
            submenu: [
                { titulo: 'Registro de folios', url: '/folios' },
                { titulo: 'Seguimiento', url: '/produccion' },
            ]
        },
        {
            titulo: 'Gestión de procesos',
            icono: 'fa fa-project-diagram',
            submenu: [
                { titulo: 'Registro y modificación de procesos', url: '/procesos' },
                { titulo: 'Costos de proceso', url: '/procesos/costos' },
                { titulo: 'Gestión de procesos en modelos', url: '/procesos/modelos' },
            ]
        },
        {
            titulo: 'Manejo de modelos',
            icono: 'fa fa-plus',
            submenu: [
                { titulo: 'Modelos', url: '/modelos' },
            ]
        }
    ];



    if (ROLE === 'ADMIN_ROLE') {
        menu.push({
            titulo: 'Administrador',
            icono: 'fa fa-gears',
            submenu: [
                { titulo: 'Usuarios', url: '/usuarios' },
                { titulo: 'Departametos', url: '/departamentos' },
                // { titulo: 'Hospitales', url: '/hospitales' },
                // { titulo: 'Médicos', url: '/medicos' },
            ]
        });
    }

    return menu;
}

module.exports = app;