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
var ordenRoutes = require('../routes/orden');
var trayectoriaRoutes = require('../routes/trayectoria');
var maquinaRoutes = require('../routes/maquina');
var gastoRoutes = require('../routes/gasto');

var modeloRoutes = require('../routes/gestionModelos/modelo');
var tamanoRoutes = require('../routes/gestionModelos/tamano');
var colorRoutes = require('../routes/gestionModelos/color');
var terminadoRoutes = require('../routes/gestionModelos/terminado');
var materialRoutes = require('../routes/almacen/material');

var R = require('../config/roles');
module.exports.ROUTES = {
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
            R.FOLIO_CONSULTAR,
        ],
        subRoutes: {
            _: {
                url: '/',
                roles: [
                    R.CONTROL_DE_PRODUCCION_REGISTRAR_FOLIOS_ROLE
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
            R.USER_ROLE,
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


    _MATERIAL: {
        url: '/material',
        route: materialRoutes,
        roles: [],
        subRoutes: {

        }
    },
}