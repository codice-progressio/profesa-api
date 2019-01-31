//importar rutas.
var appRoutes = require('../routes/app');
var usuarioRoutes = require('../routes/usuario');
var loginRoutes = require('../routes/login');
var hospitalRoutes = require('../routes/hospital');
var medicoRoutes = require('../routes/medico');
var busquedaRoutes = require('../routes/busqueda');
var uploadRoutes = require('../routes/upload');
var imagenesRoutes = require('../routes/imagenes');

// ============================================
// IMPORTAR RUTAS PARA SISTEMA CARRDUCI
// ============================================

var folioRoutes = require('../routes/folio');
var folioLineaRoutes = require('../routes/folioLinea');
var modeloCompletoRoutes = require('../routes/gestionModelos/modeloCompleto');
var clienteRoutes = require('../routes/cliente');
var departamentoRoutes = require('../routes/departamento');
var procesoRoutes = require('../routes/proceso');
var familiaDeProcesosRoutes = require('../routes/familiaDeProcesos');
var ordenRoutes = require('../routes/orden');
var trayectoriaRoutes = require('../routes/trayectoria');
var maquinaRoutes = require('../routes/maquina');
var gastoRoutes = require('../routes/gasto');

var modeloRoutes = require('../routes/gestionModelos/modelo');
var tamanoRoutes = require('../routes/gestionModelos/tamano');
var colorRoutes = require('../routes/gestionModelos/color');
var terminadoRoutes = require('../routes/gestionModelos/terminado');
var hitRoutes = require('../routes/ingenieria/hit');
var defaultsRoute = require('../routes/configCruds/defaults.crud');

var reportesRoute = require('../routes/reportes/reportes');
var almacenDeProductoTerminadoRoute = require('../routes/almacenDeProductoTerminado/almacenDeProductoTerminado');
var loteRoute = require('../routes/almacenDeProductoTerminado/lote');
var devolucionRoute = require('../routes/almacenDeProductoTerminado/devolucion');
var salidaRoute = require('../routes/almacenDeProductoTerminado/salida');

var ROLES = require('../config/roles');


module.exports.ROUTES = {

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