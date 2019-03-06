var express = require('express');
var app = express();

// Requires
var colores = require('../utils/colors');
var bcrypt = require('bcryptjs');
var Usuario = require('../models/usuario');
var jwt = require('jsonwebtoken');
var SEED = require('../config/config').SEED;
var CONST = require('../utils/constantes');
var RESP = require('../utils/respStatus');


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
                    menu: obtenerMenu(usuarioDB.role),
                    roles: CONST.ROLES
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
    console.log(`${colores.info('PROBANDO EL LOGIN')}  Entramos al login ${req}`);
    Usuario.findOne({ email: body.email }).exec().then(usuarioDB => {

        if (!usuarioDB) {
            return RESP._400(res, {
                msj: 'Credencianles incorrectas',
                err: 'No se pudo loguear.',
            });
        }

        if (!body.password) {
            return RESP._400(res, {
                msj: 'El password no debe estar vacio.',
                err: 'Parece que olvidaste escribir el password.',
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return RESP._400(res, {
                msj: 'Credencianles incorrectas',
                err: 'No se pudo loguear.',
            });
        }

        // crear un token!
        usuarioDB.password = ':D';
        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 });

        // res.status(200).json({
        //     ok: true,
        //     usuario: usuarioDB,
        //     token: token,
        //     id: usuarioDB.id,
        //     menu: obtenerMenu(usuarioDB.role),
        //     // roles: CONST.ROLES
        // });

        return RESP._200(res, `Bienvenido ${usuarioDB.nombre}`, [
            { tipo: 'usuario', datos: usuarioDB },
            { tipo: 'token', datos: token },
            { tipo: 'id', datos: usuarioDB.id },
            { tipo: 'menu', datos: obtenerMenu(usuarioDB.role) },
        ]);

    }).catch(err => {
        return RESP._500(res, {
            msj: 'Hubo un error en el login.',
            err: err,
        });
    })

});

function obtenerMenu(ROLE) {

    const MENUS = {
        PRINCIPAL: {
            // TODO MUNDO DEBE DE TENER ESTO. 
            roles: CONST.ROLES.ARRAY,
            titulo: 'Principal',
            icono: 'fas fa-comments',
            submenu: [
                { titulo: 'Dashboard', url: '/dashboard' },
            ]
        },
        REPORTES: {
            roles: [],
            titulo: 'Reportes',
            icono: 'fa fa-pie-chart',
            submenu: [
                { titulo: 'Historial de folios', url: '/folios/historial' },
                { titulo: 'Laser', url: '/reportes/laser' },
                { titulo: 'Tranformacion', url: '/reportes/transformacion' },
                { titulo: 'Quimica', url: '/reportes/quimica' },
            ]
        },
        CONTROL_DE_PRODUCCION: {
            roles: [],
            titulo: 'Control de Producción',
            icono: 'fas fa-project-diagram',
            submenu: [
                { titulo: 'Registro de folios', url: '/folios' },
                { titulo: 'Seguimiento', url: '/produccion' },
            ]
        },
        GESTION_DE_PROCESOS: {
            roles: [],
            titulo: 'Ingenieria',
            icono: 'fas fa-gears',
            submenu: [
                { titulo: 'Procesos', url: '/procesos' },
                { titulo: 'Procesos - Familias', url: '/familiaDeProcesos' },
                { titulo: 'Modelos', url: '/modelos' },
                { titulo: 'Tamanos', url: '/tamanos' },
                { titulo: 'Colores', url: '/colores' },
                { titulo: 'Terminados', url: '/terminados' },
                { titulo: 'Modelos completos', url: '/modelosCompletos' },
                { titulo: 'Maquinas', url: '/maquinas' },

                // { titulo: 'Costos de proceso', url: '/procesos/costos' },
                // { titulo: 'Hit', url: '/hits' },
            ]
        },
        ADMINISTRADOR: {
            roles: [],
            titulo: 'Administrador',
            icono: 'fas fa-toolbox',
            submenu: [
                { titulo: 'Usuarios', url: '/usuarios' },
                // { titulo: 'Departametos', url: '/departamentos' },
                { titulo: 'Clientes', url: '/clientes' },

            ]
        },

        PRODUCCION: {
            roles: [
                CONST.ROLES.EMPAQUE_REGISTRO_ROLE
            ],
            titulo: 'Registros',
            icono: 'fa fa-file-text',
            submenu: [
                { titulo: 'Almacen de boton', url: '/produccion/almacenDeBoton' },
                { titulo: 'Barnizado', url: '/produccion/barnizado' },
                { titulo: 'Burato', url: '/produccion/burato' },
                { titulo: 'Control de produccion', url: '/produccion/controlDeProduccion' },
                { titulo: 'Empaque', url: '/produccion/empaque' },
                { titulo: 'Materiales', url: '/produccion/materiales' },
                { titulo: 'Pastilla', url: '/produccion/pastilla' },
                { titulo: 'Laser', url: '/produccion/laser' },
                { titulo: 'Metalizado', url: '/produccion/metalizado' },
                { titulo: 'Seleccion', url: '/produccion/seleccion' },
                { titulo: 'Transformacion', url: '/produccion/transformacion' },
                { titulo: 'Pulido', url: '/produccion/pulido' },
                { titulo: 'Producto terminado', url: '/produccion/productoTerminado' },
            ]
        },
        // CHUCHERIAS: {
        //     roles: [
        //         CONST.ROLES.SUPER_ADMIN,
        //     ],
        //     titulo: 'SUPER-ADMIN',
        //     icono: 'fa fa-user tada inifinite animated',
        //     submenu: [
        //         { titulo: 'Hospitales', url: '/hospitales' },
        //         { titulo: 'Médicos', url: '/medicos' },
        //         { titulo: 'ProgressBar', url: '/progress' },
        //         { titulo: 'Gráficas', url: '/graficas1' },
        //         { titulo: 'Promesas', url: '/promesas' },
        //         { titulo: 'rxjs', url: '/rxjs' },
        //     ]
        // }
    }


    // Agregamos los administradordes. 

    for (const menu in MENUS) {
        if (MENUS.hasOwnProperty(menu)) {
            const element = MENUS[menu];
            if (menu !== 'CHUCHERIAS' && menu !== 'PRINCIPAL') {
                element.roles.push(CONST.ROLES.ADMIN_ROLE);
                element.roles.push(CONST.ROLES.SUPER_ADMIN);
            }

            // Ordenamos alfabeticamente los menus. 
            element.submenu.sort(
                function compare(a, b) {
                    if (a.titulo < b.titulo)
                        return -1;
                    if (a.titulo > b.titulo)
                        return 1;
                    return 0;
                }
            )
        }
    }

    const menuSeleccionado = {};


    for (let i = 0; i < ROLE.length; i++) {
        const rol = ROLE[i];

        for (const menu in MENUS) {
            if (MENUS.hasOwnProperty(menu)) {
                const element = MENUS[menu];
                if (element.roles.includes(rol)) {
                    menuSeleccionado[menu] = element;
                    // Lo borramos para que el menú no se repita. 
                    delete MENUS[menu];
                }
            }
        }

    }
    var menu = Object.values(menuSeleccionado);
    return menu;
}

module.exports = app;