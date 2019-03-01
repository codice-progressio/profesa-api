let express = require('express');
let app = express();
let FamiliaDeProceso = require('../models/procesos/familiaDeProcesos');
let ModeloCompleto = require('../models/modeloCompleto');
let Proceso = require('../models/procesos/proceso');
let colores = require("../utils/colors");
let RESP = require('../utils/respStatus');
let Departamento = require('../models/departamento');
let CONSTANSTES = require('../utils/constantes');
let PROC = require('../config/procesosDefault');


let CRUD = require('../routes/CRUD');

CRUD.app = app;
CRUD.modelo = FamiliaDeProceso;
CRUD.nombreDeObjetoSingular = 'familiaDeProcesos';
CRUD.nombreDeObjetoPlural = 'familiasDeProcesos';
CRUD.campoSortDefault = 'nombre';
CRUD.camposActualizables = {
    procesos: "",
    nombre: "",
    soloParaProductoTerminado: "",
    observaciones: null,

};



CRUD.camposDeBusqueda = [
    'nombre',
    'procesos.proceso.nombre',
    'procesos.proceso.observaciones',
];

CRUD.crud(
    'get',
    'getById',
    'getBuscar',
    'put',
    'delete'
);


// ============================================
// Guardamos una nueva famila de procesos. 
// ============================================
app.post('/', (req, res) => {
    const familiaDeProcesos = new FamiliaDeProceso(req.body);

    // Comprobamos que el órden no este repetido. 
    let normal = [];
    familiaDeProcesos.procesos.forEach(f => {
        normal.push(f.orden);
    });

    if (normal.unique().length < normal.length) {
        return RESP._400(res, {
            msj: 'No puede ser repetido',
            err: 'No se debe repetir el número de órden.'
        });
    }

    // Guardamos por defecto CONTROL DE PRODUCCIÓN como el primer proceso que se debe realizar en la familia. y
    // como primer departamento por defecto. 
    // Lo buscamos
    const p = Proceso.findOne({ nombre: PROC.CONTROL_DE_PRODUCCION._n }).exec();
    p.then(procesoD => {
        if (!procesoD) {
            return RESP._500(res, {
                msj: 'Hubo un error buscando el proceso por defecto: ' + PROC.CONTROL_PRODUCCION._n,
                err: 'El sistema necesita este proceso para poder continuar. (¿Defaults no funcionan?)',
                masInfo: [{
                    infoAdicional: CONST.ERRORES.MAS_INFO.TIPO_ERROR.NO_DATA.infoAdicional,
                    dataAdicional: CONST.ERRORES.MAS_INFO.TIPO_ERROR.NO_DATA.dataAdicional
                }]
            });
        }
        familiaDeProcesos.procesos.unshift({ proceso: procesoD._id, orden: 0 });
        return familiaDeProcesos.save();
    }).then(familiaNueva => {
        return RESP._200(res, 'Se guardo la familia de manera correcta.', [
            { tipo: 'familiaDeProcesos', datos: familiaNueva },
        ]);
    }).catch(err => {
        return RESP._500(res, {
            msj: 'Hubo un error guardando la familia de procesos.',
            err: err,
        });
    });

});

// ============================================
// Guardamos una familia existente a un modelo.
// ============================================

app.put('/:idModeloCompleto/:idFamilia', (req, res, next) => {

    //Obtenemos los id.
    var idFamilia = req.params.idFamilia;
    var idModeloCompleto = req.params.idModeloCompleto;

    //Comprobamos que el modelo exista.
    var busqueda = {
        '_id': idModeloCompleto
    };

    var set = {
        '$set': {
            familiaDeProcesos: idFamilia
        }
    };

    ModeloCompleto.findByIdAndUpdate(busqueda, set, (err, doc) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Hubo un error.",
                error: { message: err }
            });
        }
        if (!doc) {
            return res.status(400).json({
                ok: false,
                mensaje: "El modelo no existe.",
                doc: doc,
                error: { message: err }
            });
        }
        return res.status(200).json({
            ok: true,
        });

    });


});

module.exports = app;