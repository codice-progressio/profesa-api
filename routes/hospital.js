// Requires
var express = require('express');
var colores = require('../utils/colors');
var Hospital = require('../models/hospital');

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();


// ============================================
// Obtener todos los hospitales. 
// ============================================

app.get('/', (req, res, next) => {
    console.log(colores.info('/hospital') + '[get] Funcionando.');


    var desde = req.query.desde || 0;
    desde = Number(desde);

    Hospital.find({})
        .skip(desde)
        .limit(5)
        // Populate nos permite cargar los datos de las bases que estan relacionadas
        // por medio del id. El primer argumento es el nombre del campo a popular y el segúndo argumento
        // contiene las columnas que queremos utilizar. Desde el modelo mogo reconoce la colleción que
        // se necesita utilizar 
        .populate('usuario', 'nombre email')
        .exec((err, hospitales) => {
            if (err) {
                return res.status(500).json({
                    ok: true,
                    mensaje: 'Error cargando hospitales.',
                    errors: err
                });
            }

            Hospital.count({}, (err, conteo) => {

                // Si no sucede ningún error. 
                res.status(200).json({
                    ok: true,
                    hospitales: hospitales,
                    total: conteo
                });
            });


            console.log(colores.info('GET') + ' Petición correcta: hospitales');

        });

});


// ==========================================
// Obtener Hospital por ID
// ==========================================
app.get('/:id', (req, res) => {
    var id = req.params.id;
    Hospital.findById(id)
        .populate('usuario', 'nombre img email')
        .exec((err, hospital) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar hospital',
                    errors: err
                });
            }
            if (!hospital) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El hospital con el id ' + id + 'no existe',
                    errors: { message: 'No existe un hospital con ese ID' }
                });
            }
            res.status(200).json({
                ok: true,
                hospital: hospital
            });
        });
});

// ============================================
// Actualizar hospital
// ============================================

app.put('/:id', mdAutenticacion.verificarToken, (req, res) => {
    console.log(colores.info('/hospital') + '[put] Funcionando.');
    var id = req.params.id;
    var body = req.body;

    Hospital.findById(id, (err, hospital) => {

        if (err) {
            console.log(colores.danger('Error PUT - hospital') + 'Error al buscar hospital. =>' + err);

            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar hospital.',
                errors: err
            });
        }

        //Validamos que haya un hospital con ese id.
        if (!hospital) {
            console.log(colores.danger('Error PUT - hospital') + `El hospital con id ${id} no existe. =>` + err);

            return res.status(400).json({
                ok: false,
                mensaje: `El hospital con id ${id} no existe.`,
                errors: { message: 'No existe un hospital con ID.' }
            });
        }


        hospital.nombre = body.nombre;
        hospital.usuario = req.usuario._id;


        hospital.save((err, hospitalGuardado) => {

            if (err) {
                console.log(colores.danger('Error PUT - hospital') + 'Error al actualizar hospital. =>' + err);

                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar hospital.',
                    errors: err
                });
            }


            res.status(200).json({
                ok: true,
                hospital: hospitalGuardado
            });
        });
    });


});
app.post('/', mdAutenticacion.verificarToken, (req, res, next) => {

    var body = req.body;
    var hospital = new Hospital({
        nombre: body.nombre,
        //ID DEL USUARIO LOGUEADO
        usuario: req.usuario._id,

    });


    hospital.save((err, hospitalGuardado) => {
        if (err) {
            console.log(colores.danger('Error POST - hospital') + 'No se pudo completar la petición =>' + err);

            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear hospital.',
                errors: err
            });
        }

        console.log(colores.info('POST') + ' Petición correcta: hospitals');
        res.status(201).json({
            ok: true,
            hospital: hospitalGuardado
        });
    });
});


app.delete('/:id', mdAutenticacion.verificarToken, (req, res) => {
    console.log(colores.info('/hospital') + '[delete] Funcionando.');

    var id = req.params.id;

    Hospital.findByIdAndRemove(id, (err, hospitalBorrado) => {
        if (err) {
            var msj = 'Error al borrar el hospital';
            console.log(colores.danger('Error DELETE - hospital') + `${msj} =>` + err);
            return res.status(500).json({
                ok: false,
                mensaje: `${msj}`,
                errors: err
            });
        }

        if (!hospitalBorrado) {
            var msj = 'No existe un hospital con ese id.';

            console.log(colores.danger('Error DELETE - hospital') + `${msj} =>` + err);
            return res.status(400).json({
                ok: false,
                mensaje: msj,
                errors: { message: msj }
            });
        }


        console.log(colores.info('DELETE') + ' Petición correcta: hospitales');
        res.status(200).json({
            ok: true,
            hospital: hospitalBorrado
        });
    });


});


module.exports = app;