var mongoose = require("mongoose")
var Schema = mongoose.Schema

var ReportePersonalizadoAlmacenProduccionSchema = new Schema(
  {
    nombre: { type: String, required: [true, "Debes definir un nombre"] },
    descripcion: String,
    articulos: {
      type: [Schema.Types.ObjectId],
      ref: "Articulos",
      validate: [
        {
          validator: function(v) {
            return new Promise(resolve => {
              resolve(this.articulos.length > 0)
            })
          },
          msg: "Es necesario por lo menos un articulo"
        }
      ]
    }
  },

  { collection: "reportesPersonalizadosAlmacenProduccion", timestamps: true }
)

module.exports = mongoose.model(
  "ReportePersonalizadoAlmacenProduccion",
  ReportePersonalizadoAlmacenProduccionSchema
)
