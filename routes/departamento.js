var express = require("express");
var app = express();
var colores = require("../utils/colors");
var Departamento = require("../models/departamento");

app.get('/', (req, res, next) => {
    console.log(colores.info("/departamento") + "[get] Funcionando.");


    var desde = req.query.desde || 0;
    desde = Number(desde);
    Departamento.find({})
        .skip(desde)
        // .limit(5)
        .exec((err, departamentos) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error cargando departamentos.",
                    errors: err
                });
            }

            Departamento.count({}, (err, conteo) => {
                // Si no sucede ningún error.
                res.status(200).json({
                    ok: true,
                    departamentos: departamentos,
                    total: conteo
                });
            });

        });
});


// ============================================
// 
// ============================================


// ============================================
// Guardar un departamento
// ============================================

app.post("/", (req, res, next) => {
    var body = req.body;
    var departamento = new Departamento({
        nombre: body.nombre.toUpperCase(),
    });

    departamento.save((err, departamentoGuardado) => {
        if (err) {
            console.log(
                colores.danger("Error POST - departamento") +
                "No se pudo completar la petición =>" +
                err
            );

            return res.status(400).json({
                ok: false,
                mensaje: "Error al crear departamento.",
                errors: err
            });
        }

        console.log(colores.info("POST") + " Petición correcta: departamento");
        res.status(201).json({
            ok: true,
            departamento: departamentoGuardado
        });
    });
});



// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;