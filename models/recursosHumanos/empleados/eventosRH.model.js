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
      sueldAnteriorAlCambio: Number,
      //El nuevo sueldo que se va a definir
      aumento: Number,
      observacion: String
    },
    puesto: {
      // anterior: { type: Schema.Types.ObjectId, ref: "Puesto" },
      // nuevo: { type: Schema.Types.ObjectId, ref: "Puesto" },
      anterior: String,
      nuevo: String,
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
        porDefuncion: Boolean,
        porMatrimonio: Boolean,
        paraDesempenarUnCargoDeEleccionPopular: Boolean,
        citaMedica: Boolean,
        otro: String
      },
      fechaDeInicio: Date,
      fechaDeFinalizacion: Date,
      autorizacionSupervisor: Boolean,
      autorizacionRH: Boolean,
      comentario: String,
      rechazado: Boolean,
      motivoRechazo: String,
      fechaRechazo: Date
    },

    bono: {
      porAsistencia: Number,
      porPuntualidad: Number,
      porProductividad: Number,
      porResultados: Number,
      ayudaEscolarEventual: Number,
      otros: {
        cantidad: Number,
        motivo: String
      }
    },

    estatusLaboral: {
      //Relacionado con activo del empleado
      alta: Boolean,
      baja: Boolean,
      reingreso: Boolean,
      
      incapacidadEnfermedadGeneral: Boolean,
      incapacidadRiesgoDeTrabajo: Boolean,
      incapacidadMaternidad: Boolean,
      observaciones: String, 

      fechaInicioIncapacidad: Date,
      fechaFinalizacionIncapacidad: Date

    }
  },
  { _id: false }
)

module.exports = EventosRHSchema
