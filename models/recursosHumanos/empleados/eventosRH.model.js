var mongoose = require("mongoose")
var Schema = mongoose.Schema

var EventosRHSchema = new Schema(
  {
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
      // Expresa lo que antes era: 1200
      sueldAnteriorAlCambio: Number,
      //Expresa el total: 1200+600 = 1800
      aumento: Number,
      observacion: String
    },
    puesto: {
      anterior: { type: Schema.Types.ObjectId, ref: "Puesto" },
      nuevo: { type: Schema.Types.ObjectId, ref: "Puesto" },
      observaciones: String
    },

    // Una url a un documento pdf
    felicitacionPorEscrito: {
      fecha: Date,
      documento: String
    },
    // Una url a un documento pdf
    amonestacionPorEscrito: {
      fecha: Date,
      documento: String
    },
    castigo: {
      fecha: Date,
      //Es una imagen
      acta: String
    },

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
      //Relacionado con activo del empleado
      alta: Boolean,
      baja: Boolean,
      reingreso: Boolean,
      observaciones: String
    }
  },
  { _id: false }
)

module.exports = EventosRHSchema
