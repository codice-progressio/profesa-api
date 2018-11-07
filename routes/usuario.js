// Requires
var express = require('express');
var colores = require('../utils/colors');
var bcrypt = require('bcryptjs');
var Usuario = require('../models/usuario');

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();


// ============================================
// Obtener todos los usuarios. 
// ============================================
app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Usuario.find({}, 'nombre email img role google')
        //Se salta los primeros "desde" registros y carga los siguientes. 
        .skip(desde)
        // Liminta la cantidad de registros que se van a mostrar.
        .limit(5)
        .exec(
            (err, usuarios) => {
                if (err) {
                    return res.status(500).json({
                        ok: true,
                        mensaje: 'Error cargando usuarios.',
                        errors: err
                    });
                }

                // Esta función cuenta la cantidad de registros que existen.
                // Estos datos se pasan en el json para llevar la paginación.
                Usuario.count({}, (err, conteo) => {

                    // Si no sucede ningún error. 
                    res.status(200).json({
                        ok: true,
                        usuarios: usuarios,
                        total: conteo
                    });

                });


                console.log(colores.info('GET') + ' Petición correcta: Usuarios');

            });
});



// // ============================================
// // Verificar token. (Esta parte esta en middleware)
// // ============================================

// app.use('/', (req, res, next) => {

//     var token = req.query.token;
//     jwt.verify(token, SEED, (err, decode) => {

//         if (err) {
//             return res.status(401).json({
//                 ok: true,
//                 mensaje: 'Token incorrecto.',
//                 errors: err
//             });
//         }

//         next();


//     });

// });



// ============================================
// Actualizar usuario
// ============================================
app.put('/:id', [mdAutenticacion.verificarToken, mdAutenticacion.verificarADMIN_o_MismoUsuario, mdAutenticacion.verificarNoCambioDeADMIN_ROLE], (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Usuario.findById(id, (err, usuario) => {

        var body = req.body;

        if (err) {
            console.log(colores.danger('Error PUT - Usuario') + 'Error al buscar usuario. =>' + err);

            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario.',
                errors: err
            });
        }

        //Validamos que haya un usuario con ese id.
        if (!usuario) {
            console.log(colores.danger('Error PUT - Usuario') + `El usuario con id ${id} no existe. =>` + err);

            return res.status(400).json({
                ok: false,
                mensaje: `El usuario con id ${id} no existe.`,
                errors: { message: 'No existe un usuario con ID.' }
            });
        }


        usuario.nombre = body.nombre;
        usuario.email = body.email;
        usuario.role = body.role;


        usuario.save((err, usuarioGuardado) => {

            if (err) {
                console.log(colores.danger('Error PUT - Usuario') + 'Error al actualizar usuario. =>' + err);

                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar usuario.',
                    errors: err
                });
            }

            // Mantenemos el password secreto. 
            usuarioGuardado.password = ':D';

            res.status(200).json({
                ok: true,
                usuario: usuarioGuardado
            });
        });
    });
});



// ============================================
// Crear un nuevo usuario. 
// ============================================
app.post('/', (req, res) => {

    var body = req.body;
    var usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        img: body.imgl,
        role: body.role,

    });

    usuario.save((err, usuarioGuardado) => {
        if (err) {
            console.log(colores.danger('Error POST - Usuario') + 'No se pudo completar la petición =>' + err);

            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear usuario.',
                errors: err
            });
        }

        console.log(colores.info('POST') + ' Petición correcta: Usuarios');
        res.status(201).json({
            ok: true,
            usuario: usuarioGuardado,
            // Este usuario lo obtenemos desde la autenticacion 
            // "mdAutenticacion.verificarToken"
            // Agregamos en el request (req) el usuario logueado 
            // actualmente para poder hacer algúnas 
            // cosas monitas
            usuariotoken: req.usuario
        });

    });


});

// ============================================
// Borrar un usuario por el ID
// ============================================


app.delete('/:id', [mdAutenticacion.verificarToken, mdAutenticacion.verificarADMIN_ROLE], (req, res) => {

    var id = req.params.id;

    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {
        if (err) {
            var msj = 'Error al borrar usuario';
            console.log(colores.danger('Error DELETE - Usuario') + `${msj} =>` + err);
            return res.status(500).json({
                ok: false,
                mensaje: `${msj}`,
                errors: err
            });
        }

        if (!usuarioBorrado) {
            var msj2 = 'No existe un usuario con ese id.';

            console.log(colores.danger('Error DELETE - Usuario') + `${msj2} =>` + err);
            return res.status(400).json({
                ok: false,
                mensaje: msj2,
                errors: { message: msj2 }
            });
        }


        console.log(colores.info('DELETE') + ' Petición correcta: Usuarios');
        res.status(200).json({
            ok: true,
            usuario: usuarioBorrado
        });
    });
});




module.exports = app;