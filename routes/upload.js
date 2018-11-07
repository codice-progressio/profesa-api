//Esto es necesario
var express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');

var app = express();

var mdAutenticacion = require('../middlewares/autenticacion');

var Usuario = require('../models/usuario');
var Medico = require('../models/medico');
var Hospital = require('../models/hospital');
var MarcaLaser = require('../models/marcaLaser');

// default options
app.use(fileUpload());

app.put('/:tipo/:id', (req, res, next) => {

    var tipo = req.params.tipo;
    var id = req.params.id;

    // Tipos de colección.
    var tiposValidos = ['hospitales', 'medicos', 'usuarios', 'laserados'];
    if (tiposValidos.indexOf(tipo) < 0) {
        res.status(400).json({
            ok: false,
            mensaje: 'Tipo de colección no es válida.',
            errors: { message: 'Tipo de colección no es válida.' }
        });
    }

    // El fichero no esta vacio


    //Puede que agreguemos más. 
    if (!req.files) {
        res.status(400).json({
            ok: false,
            mensaje: 'No selecciono nada.',
            errors: { message: 'Debe de seleccionar una imágen.' }
        });
    }

    // Obtener nombre del archivo.
    var archivo = req.files.imagen;
    var nombreCortado = archivo.name.split('.');
    var extensionArchivo = nombreCortado[nombreCortado.length - 1];

    //Solo estas extensiónes aceptamos. 
    var extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

    if (extensionesValidas.indexOf(extensionArchivo) < 0) {
        res.status(400).json({
            ok: false,
            mensaje: 'Extención no valida.',
            errors: { message: 'Las extenciones válidas son: ' + extensionesValidas.join(', ') }
        });
    }

    // Nombre de archivo personalizado
    var nombreArchivo = `${id}-${ new Date().getMilliseconds() }.${extensionArchivo}`;

    //Mover el archivo del temporal a un path especifico. 
    var path = `./uploads/${tipo}/${nombreArchivo}`;

    archivo.mv(path, (path, err) => {
        if (err) {
            res.status(500).json({
                ok: false,
                mensaje: 'Error al mover archivo.',
                errors: err
            });
        }


    });

    subirPorTipo(tipo, id, nombreArchivo, res);

});


function subirPorTipo(tipo, id, nombreArchivo, res) {
    if (tipo === 'usuarios') {
        // Comprobamos si el usuario ya tiene una imágen.
        // Si la tiene la removemos.
        Usuario.findById(id, (err, usuario) => {

            if (!usuario) {
                return res.status(400).json({
                    ok: true,
                    mensaje: 'Usuario no existe.',
                    errors: { message: 'Usuario no existe.' }
                });
            }

            var pathViejo = './uploads/usuarios/' + usuario.img;

            // Si existe elimina la imágen anterior.
            if (fs.existsSync(pathViejo)) {
                fs.unlinkSync(pathViejo);
            }

            usuario.img = nombreArchivo;
            //Este 'usuario.save' creo que viene de la función de respuesta.
            // Desde ahí podemos guardar. 
            usuario.save((err, usuarioActualizado) => {
                //Este return es importante. 
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al guardar la imágen.',
                        errors: err
                    });
                }

                usuarioActualizado.password = ":D";
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de usuario actualizada.',
                    usuario: usuarioActualizado
                });
            });

        });
    }

    if (tipo === 'medicos') {
        // Comprobamos si el usuario ya tiene una imágen.
        // Si la tiene la removemos.
        Medico.findById(id, (err, medico) => {

            if (!medico) {
                return res.status(400).json({
                    ok: true,
                    mensaje: 'Medico no existe.',
                    errors: { message: 'medico no existe.' }
                });
            }
            var pathViejo = './uploads/medicos/' + medico.img;

            // Si existe elimina la imágen anterior.
            if (fs.existsSync(pathViejo)) {
                fs.unlinkSync(pathViejo);
            }

            medico.img = nombreArchivo;
            //Este 'medico.save' creo que viene de la función de respuesta.
            // Desde ahí podemos guardar. 
            medico.save((err, medicoActualizado) => {
                //Este return es importante. 
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al guardar la imágen.',
                        errors: err
                    });
                }
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de medico actualizada.',
                    medico: medicoActualizado
                });
            });

        });
    }

    if (tipo === 'hospitales') {
        // Comprobamos si el usuario ya tiene una imágen.
        // Si la tiene la removemos.
        Hospital.findById(id, (err, hospital) => {
            if (!hospital) {
                return res.status(400).json({
                    ok: true,
                    mensaje: 'Hospital no existe.',
                    errors: { message: 'Hospital no existe.' }
                });
            }
            var pathViejo = './uploads/hospitales/' + hospital.img;

            // Si existe elimina la imágen anterior.
            if (fs.existsSync(pathViejo)) {
                fs.unlinkSync(pathViejo);
            }

            hospital.img = nombreArchivo;
            //Este 'hospital.save' creo que viene de la función de respuesta.
            // Desde ahí podemos guardar. 
            hospital.save((err, hospitalActualizado) => {
                //Este return es importante. 
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al guardar la imágen.',
                        errors: err
                    });
                }
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de hospital actualizada.',
                    hospital: hospitalActualizado
                });
            });

        });
    }

    if (tipo === 'laserados') {
        // Comprobamos si el usuario ya tiene una imágen.
        // Si la tiene la removemos.
        MarcaLaser.findById(id, (err, marcaLaser) => {
            if (!marcaLaser) {
                return res.status(400).json({
                    ok: true,
                    mensaje: 'La marca laser no existe.',
                    errors: { message: 'Laserado no existe.' }
                });
            }
            var pathViejo = './uploads/laserados/' + marcaLaser.imagen;

            // Si existe elimina la imágen anterior.
            if (fs.existsSync(pathViejo)) {
                fs.unlinkSync(pathViejo);
            }

            marcaLaser.imagen = nombreArchivo;
            // Guardamos la nueva imágen. 
            marcaLaser.save((err, marcaLaserActualizado) => {
                //Este return es importante. 
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al guardar la imágen.',
                        errors: err
                    });
                }
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de marcaLaser actualizada.',
                    laserado: marcaLaserActualizado
                });
            });

        });
    }
}

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;