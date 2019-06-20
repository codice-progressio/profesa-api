const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const entradaLoteSchema = new Schema({


    cantidad: {
        type: Number,
        min: 1
    }, 
    createAt: { type: Date, default: Date.now },
    observaciones: String

});

module.exports = entradaLoteSchema;