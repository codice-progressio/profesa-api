// Requires
var express = require('express');
var colores = require('../utils/colors');
var bcrypt = require('bcryptjs');
var Usuario = require('../models/usuario');
var CONST = require('../utils/constantes');
var RESP = require('../utils/respStatus');

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
                        total: conteo - 1
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
    console.log('Entramos por aaca');

    Usuario.findById(id).exec().then(u => {
        console.log('siguio');
        if (!u) {
            return RESP._400(res, {
                msj: 'El usuario no existe. ',
                err: 'El id que ingresaste no esta registrado con ningún usuario.',
            });
        }

        u.nombre = body.nombre;
        u.email = body.email;
        u.role = body.role;
        // Si se agrega un password si se modifica MIENTRAS NO SEA SUPER ADMIN. 
        if (body.password && !u.role.includes(CONST.ROLES.SUPER_ADMIN)) {
            u.password = bcrypt.hashSync(body.password, 10);
        }

        return u.save();

    }).then(uG => {
        uG.password = ':D';
        return RESP._200(res, `Se actualizo el usuario ${uG.nombre} correctamente.`, [
            { tipo: 'usuario', datos: uG },
        ]);
    }).catch(err => {
        return RESP._500(res, {
            msj: 'Hubo un error actualizando el usuario.',
            err: err,
        });
    });

});



// ============================================
// Crear un nuevo usuario. 
// ============================================
app.post('/', (req, res) => {
    console.log('eSTAMOS AQUI');

    var body = req.body;



    var usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password ? body.password : null, 10),
        img: body.img,
        role: body.role,
        idTrabajador: body.idTrabajador
    });

    console.log(usuario);

    usuario.save().then(uGuardado => {
        console.log(' Esta aqua');

        return RESP._200(res, `Usuario '${uGuardado.nombre}' creado con éxito.`, [
            { tipo: 'usuario', datos: uGuardado },
            { tipo: 'usuarioToken', datos: req.usuario },
        ]);

    }).catch(err => {
        console.log(err);

        return RESP._500(res, {
            msj: 'Hubo un error guardando el usuario.',
            err: err,
        });
    });

    // usuario.save((err, usuarioGuardado) => {
    //     if (err) {

    //         return res.status(400).json({
    //             ok: false,
    //             mensaje: 'Error al crear usuario.',
    //             errors: err
    //         });
    //     }

    //     res.status(201).json({
    //         ok: true,
    //         usuario: usuarioGuardado,
    //         // Este usuario lo obtenemos desde la autenticacion 
    //         // "mdAutenticacion.verificarToken"
    //         // Agregamos en el request (req) el usuario logueado 
    //         // actualmente para poder hacer algúnas 
    //         // cosas monitas
    //         usuariotoken: req.usuario
    //     });

    // });


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