const defaults = {
    // ALMACENA LOS ID GENERADOS EL INICIAR EL SERVIDOR Y PARA DESPUES GUARDARLOS EN LA BD. 

    SUPER_ADMIN: '',
    DEPARTAMENTOS: {
        CONTROL_DE_PRODUCCION: '',
        MATERIALES: '',
        PASTILLA: '',
        TRANSFORMACION: '',
        PULIDO: '',
        SELECCION: '',
        EMPAQUE: '',
        PRODUCTO_TERMINADO: '',
        METALIZADO: '',
        BARNIZADO: '',
        BURATO: '',
        LASER: '',
        ALMACEN_DE_BOTON: '',
        TENIDO: ''
    },
    PROCESOS: {
        CONTROL_DE_PRODUCCION: '',
        LASER: '',
        ALMACEN_DE_BOTON: '',
        PRODUCTO_TERMINADO: '',
        EMPAQUE: '',
        SELECCION: '',
        LAVADO: '',
    }
};

module.exports = defaults;