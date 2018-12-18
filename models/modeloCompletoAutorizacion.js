var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var modeloAutorizacionSchema = {
    modeloCompleto: {
        type: Schema.Types.ObjectId,
        ref: 'ModeloCompleto'
    },
    autorizado: { type: Boolean },
    autorizacionSolicitada: { type: Boolean },
    usuarioQueSolicitaAutorizacion: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
    },
    autorizadoPor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
    },

};


module.exports = modeloAutorizacionSchema;