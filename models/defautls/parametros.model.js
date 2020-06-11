const mongoose = require("mongoose")
const Schema = mongoose.Schema

const parametrosDeTrabajoSchema = new Schema(
  {
    // El usuario administrador
    super: {
      definido: { type: Boolean, default: false },
      id: String,
    },

    localizacionDeOrdenes: {
      procesosIniciales: [String],
      procesosInicialesAlmacen: [String],
      procesosFinales: [String],
    },

    procesosEspeciales: [String],
    departamentoTransformacion: String,
    jwtInvalid: [String],
    estacionesDeEscaneo: [
      {
        departamento: String,
        usuarios: [String],
        ponerATrabajar: {type: Boolean, default: false}
      },
    ],
  },
  { collection: "parametrosDeTrabajo" }
)

module.exports = mongoose.model(
  "parametrosDeTrabajo",
  parametrosDeTrabajoSchema
)
