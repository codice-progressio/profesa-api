let mongoose = require("mongoose")
let Schema = mongoose.Schema
let procesoSchema = require("./proceso")
var ModeloCompleto = require("../modeloCompleto")
var colores = require("../../utils/colors")

let familiaDeProcesosSchema = new Schema({
  procesos: [
    {
      proceso: {
        type: Schema.Types.ObjectId,
        ref: "Proceso",
        required: [true, "El proceso es necesario."],
      },
      // TODO: Debe mantener integridad y usar un solo schema. Ver notda de Modelo completo.
      orden: { type: Number },
      // Copia del interior de: Boolean, required: [true, 'Debes definir si este proceso requiere ser transformado para poder realizarse.'] }
    },
  ],
  nombre: { type: String, required: [true, "El nombre es requerido."] },
  // Familias que requieren que el producto este terminado para poderse asignar.
  soloParaProductoTerminado: { type: Boolean, default: false },
  observaciones: String,
})

let autoPopulate = function (next) {
  this.populate("procesos.proceso")
  this.populate({
    path: "procesos.proceso",
    populate: { path: "departamento costos maquinas" },
  })
  next()
}

/**
 *Esta funcion elimina los datos relacionados a la familia de procesos como 
 son el modelo completo. 
 *
 * @param {*} next 
 */
let eliminarRelacionados = function (next) {
  // Obtenemos el id de la familia.
  var idFamilia = this._conditions._id

  // Buscamos todos los modelos completos relacionados.

  ModeloCompleto.deleteMany({ familiaDeProcesos: idFamilia })
    .then(resp => {
      console.log(
        colores.info("DATOS RELACIONADOS ELIMINADOS") +
          "Se eliminaron los modelos completos relacionados a esta familia."
      )
      next()
    })
    .catch(err => {
      console.log(
        colores.danger("ERROR EN MIDDLEWARE=> familiaDeProcesos.js: ") + err
      )
      throw new Error(err)
    })
}

familiaDeProcesosSchema
  .pre("findOneAndRemove", eliminarRelacionados)
  .pre("find", autoPopulate)
  .pre("findOne", autoPopulate)
  .pre("findById", autoPopulate)
// El orden es importante por que estamos suponiendo que hay un _id a la
// hora de comprobar este pre.

module.exports = mongoose.model("FamiliaDeProcesos", familiaDeProcesosSchema)
