var LV = {
    U: 'URGENTE',
    M: 'MUESTRA',
    P: 'PRODUCCIÓN',
    A: 'ALMACEN',
};

module.exports.KEY = {
    type: String,
    required: [true, 'Es necesario el nivel de urgencia.'],
    default: LV.P,
    enum: {
        values: [
            LV.A,
            LV.P,
            LV.U,
            LV.M,
        ],
        message: '{VALUE} no es un nivel de urgencia permitido. NUEVO'
    },
};

module.exports.LV = LV;