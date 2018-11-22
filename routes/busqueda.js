//Esto es necesario
var express = require('express');
var app = express();


var Hospital = require('../models/hospital');
var Medico = require('../models/medico');
var Usuario = require('../models/usuario');
var Cliente = require('../models/cliente');
var ModeloCompleto = require('../models/modeloCompleto');
var Modelo = require('../models/modelo');
var Tamano = require('../models/tamano');
var Color = require('../models/colores/color');
var Terminado = require('../models/terminado');
var MarcaLaser = require('../models/marcaLaser');
var VersionModelo = require('../models/versionModelo');
var colores = require('../utils/colors');
var RESP = require('../utils/respStatus');

// ============================================
// Busqueda general
// ============================================

app.get('/todo/:busqueda', (req, res, next) => {

    var busqueda = req.params.busqueda;
    var regex = new RegExp(busqueda, 'i');

    // A diferencia de retornar una sola promesa, aqui pasamos un arreglo de funciones
    // que retornan promesas. Cada una de ellas retorna el resultado en el órden
    // en que se agreguen. 
    Promise.all(
        [
            buscarHospitales(busqueda, regex),
            buscarMedicos(busqueda, regex),
            buscarUsuarios(busqueda, regex),
        ]
    ).then((respuestas) => {
        res.status(200).json({
            ok: true,
            hospitales: respuestas[0],
            medicos: respuestas[1],
            usuarios: respuestas[2],
        });
    });
});


// ============================================
// Busqueda especifica: Colección
// ============================================

app.get('/coleccion/:tabla/:busqueda', (req, res) => {

    var tabla = req.params.tabla;
    var busqueda = req.params.busqueda;
    var regex = new RegExp(busqueda, 'i');

    if (promesas.hasOwnProperty(tabla)) {
        promesas[tabla](busqueda, regex).then((respuesta) => {
            return res.status(200).json({
                ok: true,
                [tabla]: respuesta,
            });
        }).catch(err => {
            return RESP._500(res, err);
        });
    } else {
        return res.status(400).json({
            ok: false,
            mensaje: "La tabla no es valida.",
            error: { message: "Tipos de tabla/colección no validas" }
        });
    }
});


var promesas = {
    "hospitales": buscarHospitales,
    "medicos": buscarMedicos,
    "usuarios": buscarUsuarios,
    'usuariosRole': buscarUsuariosPorRole,
    "clientes": buscarClientes,
    "modelosCompletos": buscarModelosCompletos,

};

// Esta es una promesa y es para crear funciones asincronas de manera fácil y 
// rápida. 
function buscarHospitales(busqueda, regex) {

    // Es necesaio que retorne la misma promesa que se instancia.
    return new Promise((resolve, reject) => {
        // Creamos la nueva instanacia para la busqueda asincrona. 
        Hospital.find({ nombre: regex })
            .populate('usuario', 'nombre email img')
            .exec((err, hospitales) => {
                if (err) {
                    // Si tenemos un error tomamos el valor reject y le pasamos un valor,
                    // de esta manera la promesa sabe que todo se fue a la #$TE
                    reject('Error al cargar hospitales', err);
                } else {
                    // Si no hubo error entonces pasamos el resultado al resolve para
                    // que la promesa nos lo devuelva. 
                    resolve(hospitales);
                }
            });
    });
}

function buscarMedicos(busqueda, regex) {

    return new Promise((resolve, reject) => {
        Medico.find({ nombre: regex })
            .populate('usuario', 'nombre email img')
            .populate('hospital')
            .exec((err, medicos) => {
                if (err) {
                    reject('Error al cargar medicos', err);
                } else {
                    resolve(medicos);
                }
            });
    });
}

function buscarUsuarios(busqueda, regex) {

    return new Promise((resolve, reject) => {
        Usuario.find({}, 'nombre email role img')
            //Permite la busqueda en diferentes campos. 
            .or({ 'nombre': regex }, { 'email': regex })
            .exec((err, usuarios) => {
                if (err) {
                    reject('Error al cargar usuarios', err);
                } else {
                    resolve(usuarios);
                }
            });
    });
}

function buscarUsuariosPorRole(busqueda, regex) {
    // Esta función nos ayuda a filtra los usuarios por 
    // role. Por ejemplo, los que son vendedores.
    console.log('Buscar usuarios por role');

    return new Promise((resolve, reject) => {
        Usuario.find({}, 'nombre email role img _id')
            .or({ 'role': regex })
            .exec((err, usuarios) => {
                if (err) {
                    reject('Error al cargar usuarios', err);
                } else {
                    console.log(usuarios.length + " =>>> ");

                    if (usuarios.length === 0) {
                        reject(RESP.errorGeneral({
                            msj: `No existen usuarios con ROL ${regex.toString()}`,
                            err: 'Es necesario que se registren usuarios con este rol para poder continuar.',
                        }));
                    } else {
                        resolve(usuarios);
                    }
                }
            });
    });
}


// Esta es una promesa y es para crear funciones asincronas de manera fácil y 
// rápida. 
function buscarClientes(busqueda, regex) {

    // Es necesaio que retorne la misma promesa que se instancia.
    return new Promise((resolve, reject) => {
        // Creamos la nueva instanacia para la busqueda asincrona. 
        Cliente.find({
                $or: [
                    { nombre: regex },
                    { sae: regex }
                ]
            })
            .exec((err, clientes) => {
                if (err) {
                    // Si tenemos un error tomamos el valor reject y le pasamos un valor,
                    // de esta manera la promesa sabe que todo se vue a la #$TE
                    reject('Error al cargar clientes', err);
                } else {
                    // Si no hubo error entonces pasamos el resultado al resolve para
                    // que la promesa nos lo devuelva. 
                    resolve(clientes);
                }
            });
    });
}


function buscarModelosCompletos(busqueda, regex) {

    // Es necesaio que retorne la misma promesa que se instancia.
    return new Promise((resolve, reject) => {
        Modelo.find({ modelo: regex }, '_id').exec((err, modelos) => {

            if (err) {
                reject('Error al buscar un modelo' + err);
            } else {
                // Filtramos los id para buscarlos dentro del modelo completo
                ids = [];
                modelos.forEach(i => {
                    ids.push(i._id);
                });

                // Creamos la nueva instanacia para la busqueda asincrona. 
                ModeloCompleto.find({ modelo: ids })
                    .populate('modelo')
                    .populate('tamano')
                    .populate('color')
                    .populate('Terminado')
                    .populate('laserAlmacen')
                    .populate('versionModelo')
                    .populate({
                        path: 'familiaDeProcesos',
                        populate: {
                            path: 'procesos.proceso',
                            populate: {
                                path: 'maquinas  departamento'
                            }
                        }
                    })
                    .populate({
                        path: 'procesosEspeciales.proceso',
                        populate: {
                            path: 'maquinas  departamento'
                        }
                    })

                .exec((err, modeloCompleto) => {
                    if (err) {
                        // Si tenemos un error tomamos el valor reject y le pasamos un valor,
                        // de esta manera la promesa sabe que todo se vue a la #$TE
                        reject('Error al cargar modeloCompleto' + err);
                    } else {
                        // Si no hubo error entonces pasamos el resultado al resolve para
                        // que la promesa nos lo devuelva. 
                        resolve(modeloCompleto);
                    }
                });
            }
        });
    });

    // ============================================
    // Busqueda de modelos completos
    // ============================================

    function buscarMC(busqueda) {

        // Separamos la busqueda
        let arraRegex = busqueda.split('-');
        arraRegex = arraRegex.map(x => x = x.toUpperCase());
        arraRegex = arraRegex.map(x => x = new RegExp(x, 'i'));
        // DEBE SEGUIR ESTE ÓRDEN, DE OTRA MANERA NO FUNCIONA
        // 
        //      MOD-TAM-COL-TER-MARCA_LASER-VERSION
        // 
        // DE MANERA QUE SE ORDENEN DE LA SIGUIENTE MANERA. 
        // 
        //                [0] MOD
        //                [1] TAM
        //                [2] COL
        //                [3] TER
        //                [4] MARCA_LASER
        //                [5] VERSION
        // 
        var arregloDePromesas = [];
        var arrSchemas = [
            { s: Modelo, campo: 'modelo' },
            { s: Tamano, campo: 'tamano' },
            { s: Color, campo: 'color' },
            { s: Terminado, campo: 'terminado' },
            { s: MarcaLaser, campo: 'laser' },
            { s: VersionModelo, campo: 'versionModelo' },
        ];

        for (let i = 0; i < arrSchemas.length; i++) {
            const sch = arrSchemas[i];
            const regex = arraRegex[i];
            const pro = new Promise((resolve, reject) => {
                // Si no hay regex mandamos null para no buscar nada. 
                if (!regex) { resolve(null); } else {
                    var a = sch.s.find({
                        [sch.campo]: regex
                    }).exec();
                    a.then(b => {
                        // Retornamos el nombre de los campos para 
                        // usarlos cuando busquemos el modelo completo. 
                        resolve({ datos: b, campo: sch.campo });
                    }).catch(err => reject(err));
                }
            });
            // Guardamos la promesa para ejecutarla en la busqueda de modelos completos. 
            arregloDePromesas.push(pro);
        }
        return arregloDePromesas;
    }

    function combinacionesDeBusqueda(arr) {

        const arreBusqueda = [];

        arr.map(x => {
            if (x) {
                x.datos.map(y => {
                    if (!arreBusqueda[x.campo]) {
                        arreBusqueda[x.campo] = [];
                    }
                    arreBusqueda.push({
                        [x.campo]: y._id
                    });
                });

            }
        });

        for (const key in arreBusqueda) {
            if (arreBusqueda.hasOwnProperty(key)) {
                const arreglo = arreBusqueda[key];


            }
        }

        return arreBusqueda;


    }


    // ============================================
    // Fin busqueda de modelos completos
    // ============================================


}

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;