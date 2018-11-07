const CONSTANTES = {
    DEPARTAMENTOS: {
        MATERIALES: { _v: 'MATERIALES', _n: 'MATERIALES' },
        TRANSFORMACION: { _v: 'TRANSFORMACION', _n: 'TRANSFORMACIÓN' },
        PASTILLA: { _v: 'PASTILLA', _n: 'PASTILLA' },
        SELECCION: { _v: 'SELECCION', _n: 'SELECCIÓN' },
        PULIDO: { _v: 'PULIDO', _n: 'PULIDO' },
        EMPAQUE: { _v: 'EMPAQUE', _n: 'EMPAQUE' },
        PRODUCTO_TERMINADO: { _v: 'PRODUCTO_TERMINADO', _n: 'PRODUCTO TERMINADO' }
    },
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





module.exports = CONSTANTES;