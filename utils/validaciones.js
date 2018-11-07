const VALIDACIONES = {
    NUMEROS: {
        entero: (a) => {
            // Comprobamos que el número sea un entero. 
            return Number.isInteger(a);
        }

    }
};



module.exports = VALIDACIONES;