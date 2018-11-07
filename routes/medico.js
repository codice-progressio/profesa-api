// Requires
var express = require('express');
var colores = require('../utils/colors');
var Medico = require('../models/medico');

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();


// ============================================
// Obtener todos los medicos. 
// ============================================

app.get('/', (req, res, next) => {
    console.log(colores.info('/medico') + '[get] Funcionando.');

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Medico.find({})
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre email')
        .populate('hospital')
        .exec((err, medicos) => {
            if (err) {
                return res.status(500).json({
                    ok: true,
                    mensaje: 'Error cargando medicos.',
                    errors: err
                });
            }

            Medico.count({}, (err, conteo) => {
                // Si no sucede ningún error. 
                res.status(200).json({
                    ok: true,
                    medicos: medicos,
                    total: conteo
                });

            });

            console.log(colores.info('GET') + ' Petición correcta: medicos');

        });

});

// ============================================
// Obtener un médico
// ============================================

app.get('/:id', (req, res) => {
    var id = req.params.id;
    Medico.findById(id)
        .populate('usuario', 'nombre email img')
        .populate('hospital')
        .exec((err, medico) => {
            if (err) {
                console.log(colores.danger('Error GET - medico') + 'Error al buscar medico. =>' + err);

                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar medico.',
                    errors: err
                });
            }

            //Validamos que haya un medico con ese id.
            if (!medico) {
                console.log(colores.danger('Error GET - medico') + `El medico con id ${id} no existe. =>` + err);

                return res.status(400).json({
                    ok: false,
                    mensaje: `El medico con id ${id} no existe.`,
                    errors: { message: 'No existe un medico con ese ID.' }
                });
            }

            res.status(200).json({
                ok: true,
                medico: medico
            });


        });
});

// ============================================
// Actualizar medico
// ============================================

app.put('/:id', mdAutenticacion.verificarToken, (req, res) => {
    console.log(colores.info('/medico') + '[put] Funcionando.');
    var id = req.params.id;
    var body = req.body;

    Medico.findById(id, (err, medico) => {

        medico.nombre = body.nombre;
        medico.usuario = req.usuario._id;
        medico.hospital = body.hospital;


        medico.save((err, medicoGuardado) => {

            if (err) {
                console.log(colores.danger('Error PUT - medico') + 'Error al actualizar medico. =>' + err);

                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar medico.',
                    errors: err
                });
            }


            res.status(200).json({
                ok: true,
                medico: medicoGuardado
            });
        });
    });


});
app.post('/', mdAutenticacion.verificarToken, (req, res, next) => {

    var body = req.body;
    var medico = new Medico({
        nombre: body.nombre,
        usuario: req.usuario._id,
        hospital: body.hospital

    });


    medico.save((err, medicoGuardado) => {
        if (err) {
            console.log(colores.danger('Error POST - medico') + 'No se pudo completar la petición =>' + err);

            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear medico.',
                errors: err
            });
        }

        console.log(colores.info('POST') + ' Petición correcta: medicos');
        res.status(201).json({
            ok: true,
            medico: medicoGuardado
        });
    });
});


app.delete('/:id', mdAutenticacion.verificarToken, (req, res) => {
    console.log(colores.info('/medico') + '[delete] Funcionando.');

    var id = req.params.id;

    Medico.findByIdAndRemove(id, (err, medicoBorrado) => {
        if (err) {
            var msj = 'Error al borrar el medico';
            console.log(colores.danger('Error DELETE - medico') + `${msj} =>` + err);
            return res.status(500).json({
                ok: false,
                mensaje: `${msj}`,
                errors: err
            });
        }

        if (!medicoBorrado) {
            var msj2 = 'No existe un medico con ese id.';

            console.log(colores.danger('Error DELETE - medico') + `${msj2} =>` + err);
            return res.status(400).json({
                ok: false,
                mensaje: msj2,
                errors: { message: msj2 }
            });
        }


        console.log(colores.info('DELETE') + ' Petición correcta: medicos');
        res.status(200).json({
            ok: true,
            medico: medicoBorrado
        });
    });


});


module.exports = app;