let DEPTO = require('../config/departametosDefaults');
let PROC = require('../config/procesosDefault');

let colores = require('../utils/colors');

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
    /**
     * Retorna los datos necesarios para definir la paginacion en la consulta. 
     *  
     * Es necesario definir en el query 'desde', 'limite', 'sort' y 'campo'.
     * 
     * @param {*} query El elemento de donde se van a extraer los datos. 
     * @param {*} CAMPO El nombre del campo por defecto. 
     * @returns Retorna los elementos necesarios para la paginacion en un objeto. 
     * 
     * {
            desde,
            limite,
            sort,
            campo,
        }
     */
    consultas: function(query, CAMPO) {
        const desde = Number(query.desde || 0);
        const limite = Number(query.limite || 30);
        const sort = Number(query.sort || 1);
        const campo = String(query.campo || CAMPO);

        return {
            desde: desde,
            limite: limite,
            sort: sort,
            campo: campo,
        };

    }
};