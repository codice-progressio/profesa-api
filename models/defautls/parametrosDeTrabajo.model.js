const mongoose = require("mongoose")
const Schema = mongoose.Schema

const parametrosDeTrabajoSchema = new Schema(
  {
    localizacionDeOrdenes: {
      procesosIniciales: [String],
      procesosFinales: [String]
    }
  },
  { collection: "parametrosDeTrabajo" }
)

module.exports = mongoose.model(
  "parametrosDeTrabajo",
  parametrosDeTrabajoSchema
)
