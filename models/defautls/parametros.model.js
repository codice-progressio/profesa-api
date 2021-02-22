const mongoose = require("mongoose")
const Schema = mongoose.Schema

const parametrosDeTrabajoSchema = new Schema(
  {
    // El usuario administrador
    super: {
      definido: { $type: Boolean, default: false },
      id: String,
    },

    // Nos sirve para el autocompletado de etiquetas.
    etiquetas: [String],

    // localizacionDeOrdenes: {
    //   procesosIniciales: [String],
    //   procesosInicialesAlmacen: [String],
    //   procesosFinales: [String],
    //   campoFinal: String,
    // },

    // procesosEspeciales: [String],
    // departamentoTransformacion: String,
    // jwtInvalid: [String],
    // estacionesDeEscaneo: [
    //   {
    //     departamento: String,
    //     usuarios: [String],
    //     ponerATrabajar: { $type: Boolean, default: false },
    //     recibirTodo: { $type: Boolean, default: false },
    //     ponerATrabajarConMaquina: { $type: Boolean, default: false },
    //     maquinas:[String],
    //     registrarTodo: { $type: Boolean, default: false },
    //     ultimoDepartamento: { $type: Boolean, default: false },
    //     //QuestionBase in GUI
    //     inputsFormulario: [
    //       {
    //         value: String,
    //         key: String,
    //         label: String,
    //         required: Boolean,
    //         order: Number,
    //         controlType: String,
    //         type: String,
    //         classForGroup: String,
    //         mask: String,
    //         thousandSeparator: String,
    //         suffix: String,
    //       },
    //     ],
    //   },
    // ],

    // actualizaciones: {
    //   partes: { $type: Boolean, default: false },
    // },
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
