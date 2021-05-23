function f(txt) {
    return '[ ' + txt + ' ] ';
}
var colores = {

    reset: "\x1b[0m",
    negrita: "\x1b[1m",
    subrayado: "\x1b[4m",
    resaltar: "\x1b[5m",
    invertir_fondo: "\x1b[7m",
    fuente: {
        negro: "\x1b[30m",
        rojo: "\x1b[31m",
        verde: "\x1b[32m",
        amarillo: "\x1b[33m",
        azul: "\x1b[34m",
        magenta: "\x1b[35m",
        cian: "\x1b[36m",
        blanco: "\x1b[37m",
    },
    fondo: {
        negro: "\x1b[40m",
        rojo: "\x1b[41m",
        verde: "\x1b[42m",
        amarillo: "\x1b[43m",
        azul: "\x1b[44m",
        magenta: "\x1b[45m",
        cian: "\x1b[46m",
        blanco: "\x1b[47m",
    },
    especial: function(datos) {
        return datos.fondo +
            datos.fuente +
            datos.txt +
            colores.reset;
    },

    success: function(txt) {
        return this.fuente.verde +
            f(txt) +
            this.reset;
    },
    danger: function(txt) {
        return this.fuente.rojo +
            f(txt) +
            this.reset;
    },

    warning: function(txt) {
        return this.fuente.amarillo +
            f(txt) +
            this.reset;
    },
    info: function(txt) {
        return this.fuente.cian +
            f(txt) +
            this.reset;
    },
    log: {
        debug: function(txt) {
            return `${f('DEBUG')} ${this.reset}=> ${txt}`;
        }
    }

};



module.exports = colores;