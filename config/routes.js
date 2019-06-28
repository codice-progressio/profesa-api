//importar rutas.
let usuarioRoutes = require('../routes/usuario');
let loginRoutes = require('../routes/login');
let hospitalRoutes = require('../routes/hospital');
let medicoRoutes = require('../routes/medico');
let busquedaRoutes = require('../routes/busqueda');
let uploadRoutes = require('../routes/upload');
let imagenesRoutes = require('../routes/imagenes');

// ============================================
// IMPORTAR RUTAS PARA SISTEMA CARRDUCI
// ============================================

let folioRoutes = require('../routes/folio');
let folioLineaRoutes = require('../routes/folioLinea');
let modeloCompletoRoutes = require('../routes/gestionModelos/modeloCompleto');
let clienteRoutes = require('../routes/cliente');
let departamentoRoutes = require('../routes/departamento');
let procesoRoutes = require('../routes/proceso');
let familiaDeProcesosRoutes = require('../routes/familiaDeProcesos');
let ordenRoutes = require('../routes/orden');
let trayectoriaRoutes = require('../routes/trayectoria');
let maquinaRoutes = require('../routes/maquina');
let gastoRoutes = require('../routes/gasto');

let modeloRoutes = require('../routes/gestionModelos/modelo');
let tamanoRoutes = require('../routes/gestionModelos/tamano');
let colorRoutes = require('../routes/gestionModelos/color');
let terminadoRoutes = require('../routes/gestionModelos/terminado');
let hitRoutes = require('../routes/ingenieria/hit');
let defaultsRoute = require('../routes/configCruds/defaults.crud');

let reportesRoute = require('../routes/reportes/reportes');
let almacenDeProductoTerminadoRoute = require('../routes/almacenDeProductoTerminado/almacenDeProductoTerminado');
let loteRoute = require('../routes/almacenDeProductoTerminado/lote');
let devolucionRoute = require('../routes/almacenDeProductoTerminado/devolucion');
let salidaRoute = require('../routes/almacenDeProductoTerminado/salida');

let folioNewRoutes = require('../routes/folio.route')

let ROLES = require('../config/roles');

var almacenDescripcionRoute = require('../routes/almacenDeMateriaPrimaYRefacciones/almacenDescripcion.route');
var articuloRoute = require('../routes/almacenDeMateriaPrimaYRefacciones/articulo.route');




module.exports.ROUTES = {

    _ARTICULO: {

        url: '/articulo',
        route: articuloRoute,
        roles: [],
        subRoutes: {}
    },


    
    _ALMACEN_DESCRIPCION: {

        url: '/almacenDescripcion',
        route: almacenDescripcionRoute,
        roles: [],
        subRoutes: {}
    },



    _ALMACEN_DE_PRODUCTO_TERMINADO: {

        url: '/almacenDeProductoTerminado',
        route: almacenDeProductoTerminadoRoute,
        roles: [],
        subRoutes: {}
    },

    _ALMACEN_DE_PRODUCTO_TERMINADO_LOTE: {

        url: '/almacenDeProductoTerminado/lote',
        route: loteRoute,
        roles: [],
        subRoutes: {}
    },

    _ALMACEN_DE_PRODUCTO_TERMINADO_SALIDA: {

        url: '/almacenDeProductoTerminado/salida',
        route: salidaRoute,
        roles: [],
        subRoutes: {}
    },

    _ALMACEN_DE_PRODUCTO_TERMINADO_DEVOLUCION: {

        url: '/almacenDeProductoTerminado/devolucion',
        route: devolucionRoute,
        roles: [],
        subRoutes: {}
    },


    _REPORTES: {

        url: '/reportes',
        route: reportesRoute,
        roles: [],
        subRoutes: {}
    },



    _DEFAULTS: {
        url: '/defaults',
        route: defaultsRoute,
        roles: [],
        subRoutes: {}

    },


    _LOGIN: {
        url: '/login',
        route: loginRoutes,
        roles: [],
        subRoutes: {}
    },



    _FOLIO: {
        url: '/folio',
        route: folioRoutes,
        roles: [
            ROLES.FOLIO_CONSULTAR,
        ],
        subRoutes: {
            _: {
                url: '/',
                roles: [
                    ROLES.CONTROL_DE_PRODUCCION_REGISTRAR_FOLIOS_ROLE
                ]
            }
        }
    },
    _FOLIO_NEW: {
        url: '/folios',
        route: folioNewRoutes,
        roles: [

        ]
    },




    _USUARIO: {
        url: '/usuario',
        route: usuarioRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _HOSPITAL: {
        url: '/hospital',
        route: hospitalRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _MEDICO: {
        url: '/medico',
        route: medicoRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _BUSQUEDA: {
        url: '/busqueda',
        route: busquedaRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _UPLOAD: {
        url: '/upload',
        route: uploadRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _IMG: {
        url: '/img',
        route: imagenesRoutes,
        roles: [
            ROLES.USER_ROLE,
        ],
        subRoutes: {

        }
    },
    _FOLIOLINEA: {
        url: '/folioLinea',
        route: folioLineaRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _MODELOCOMPLETO: {
        url: '/modeloCompleto',
        route: modeloCompletoRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _CLIENTE: {
        url: '/cliente',
        route: clienteRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _DEPARTAMENTO: {
        url: '/departamento',
        route: departamentoRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _PROCESO: {
        url: '/proceso',
        route: procesoRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _FAMILIADEPROCESOS: {
        url: '/familiaDeProcesos',
        route: familiaDeProcesosRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _ORDEN: {
        url: '/orden',
        route: ordenRoutes,
        roles: [],
        subRoutes: {}
    },
    _TRAYECTORIA: {
        url: '/trayectoria',
        route: trayectoriaRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _MAQUINA: {
        url: '/maquina',
        route: maquinaRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _GASTOGASTO: {
        url: '/gasto',
        route: gastoRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _MODELO: {
        url: '/modelo',
        route: modeloRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _TAMANO: {
        url: '/tamano',
        route: tamanoRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _COLOR: {
        url: '/color',
        route: colorRoutes,
        roles: [],
        subRoutes: {

        }
    },
    _TERMINADO: {
        url: '/terminado',
        route: terminadoRoutes,
        roles: [],
        subRoutes: {

        }
    },



    _HIT: {
        url: '/hit',
        route: hitRoutes,
        roles: [],
        subRoutes: {

        }
    },

};