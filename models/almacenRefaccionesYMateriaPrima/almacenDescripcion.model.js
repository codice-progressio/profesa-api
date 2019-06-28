var mongoose = require("mongoose")
var Articulo = require("../../models/almacenRefaccionesYMateriaPrima/articulo.model")

var Schema = mongoose.Schema

var AlmacenDescripcionSchema = new Schema({
  nombre: { type: String, required: [true, "El nombre es necesario."] },
  descripcion: String,
  ubicacion: { type: String }
})

let eliminarArticulosRelacionados = function(next) {
  // Buscamos todos los articulos que esten relacionados.
  // deleteMany() no lanza pre-post middleware
  Articulo.find({ almacen: this._id })
    .deleteMany()
    .exec()
    .then(() => {
      next()
    })
    .catch((err) => {
      next(err)
    })
}

AlmacenDescripcionSchema.pre("remove", eliminarArticulosRelacionados)

module.exports = mongoose.model("AlmacenDescripcion", AlmacenDescripcionSchema)
