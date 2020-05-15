const mongoose = require("mongoose")
const Schema = mongoose.Schema

const parametrosDeTrabajoSchema = new Schema(
  {

    // El usuario administrador
    super: {
      definido: { type: Boolean, default: false },
      id:String
    }, 


    localizacionDeOrdenes: {
      procesosIniciales: [String],
      procesosInicialesAlmacen: [String],
      procesosFinales: [String]
    },

    procesosEspeciales: [String],
    jwtInvalid: [String]
  },
  { collection: "parametrosDeTrabajo" }
)

module.exports = mongoose.model(
  "parametrosDeTrabajo",
  parametrosDeTrabajoSchema
)
