var DEPTO = require('../config/departametosDefaults');
var PROC = require('../config/procesosDefault');

module.exports = {
    PROCESOS: PROC,
    DEPARTAMENTOS: DEPTO,
    ERRORES: {
        MAS_INFO: {
            TIPO_ERROR: {
                NO_DATA: {
                    infoAdicional: 'sinData',
                    dataAdicional: 'No se ha especificado información suficiente en el sistema para que se lleva a cabo la solicitud.'
                },
                SIN_REGISTROS: {
                    infoAdicional: 'sinRegistros',
                    dataAdicional: 'Al parecer aun no guardas ningún elemento de este tipo.'
                },
            },
        },
    },
};