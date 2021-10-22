const mongoose = require("mongoose")
const Schema = mongoose.Schema

const parametrosDeTrabajoSchema = new Schema(
  {
    // El usuario administrador
    // super: {
    //   definido: { $type: Boolean, default: false },
    //   id: String,
    // },

    // Nos sirve para el autocompletado de etiquetas.
    etiquetas: [String],

    // La list por defecto que vamos a utilizar.
    listaDePreciosDefault: {
      $type: mongoose.Schema.Types.ObjectId,
      ref: "listaDePrecios",
    },

    //Versionado de datos offline. Si algunos de los 
    // datos offline se modifica este tiene que aumentar. 
    version_offline:{$type:Number, default:0}
  },
  { collection: "parametrosDeTrabajo", typeKey: "$type" }
)

parametrosDeTrabajoSchema.statics.crearEtiquetaSiNoExiste = function (
  etiqueta
) {
  return this.findOne()
    .select("etiquetas")
    .exec()
    .then(parametros => {
      // No debe estar vacia la etiqueta.
      if (!etiqueta.trim())
        throw "[PARAMETROS] La etiqueta no puede estar vacia"
      // si no existe la etiqueta dentro del arreglo de etiquetas, la creamos
      const existe = Array.from(parametros.etiquetas).includes(etiqueta)

      if (existe) return

      parametros.etiquetas.push(etiqueta)
      return parametros.save()
    })
}

module.exports = mongoose.model(
  "parametrosDeTrabajo",
  parametrosDeTrabajoSchema
)
