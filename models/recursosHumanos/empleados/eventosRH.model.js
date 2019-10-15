var mongoose = require("mongoose")
var Schema = mongoose.Schema

var EventosRHSchema = new Schema({
  eventoPendienteDeDefinir: { type: Boolean, default: false },
  curso: {
    type: Schema.Types.ObjectId,
    ref: "Curso"
  },
  vacaciones: {
    desde: Date,
    hasta: Date
  },
  cambiosDeSueldo: {
    sueldAnteriorAlCambio: Number,
    aumento: Number
  },
  puesto: {
    type: Schema.Types.ObjectId,
    ref: "Puesto"
  },

  // Una url a un documento pdf
  felicitacionPorEscrito: String,
  // Una url a un documento pdf
  amonestacionPorEscrito: String,
  castigo: String,

  permiso: {
    conGoceDeSueldo: Boolean,
    sinGoceDeSueldo: Boolean,
    motivo: {
      porPaternidad: Boolean,
      porDefunción: Boolean,
      porMatrimonio: Boolean,
      paraDesempeñarUnCargoDeElecciónPopular: Boolean,
      otro: String
    },
    fechaDeInicio: Date,
    fechaDeFinalizacion: Date,
    autorizacionSupervisor: Boolean,
    autorizacionRH: Boolean,
    comentario: String
  },

  bono: {
    porAsistencia: Number,
    porPuntualidad: Number,
    porProductividad: Number,
    porResultados: Number,
    ayudaEscolarEventual: Number
  },

  estatusLaboral: {
    alta: Boolean,
    baja: Boolean,
    reingreso: Boolean
  }
})

module.exports = EventosRHSchema
