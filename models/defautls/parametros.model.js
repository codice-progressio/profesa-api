const mongoose = require("mongoose")
const Schema = mongoose.Schema

const parametrosDeTrabajoSchema = new Schema(
  {
    // El usuario administrador
    super: {
      definido: { $type: Boolean, default: false },
      id: String,
    },

    localizacionDeOrdenes: {
      procesosIniciales: [String],
      procesosInicialesAlmacen: [String],
      procesosFinales: [String],
      campoFinal: String,
    },

    procesosEspeciales: [String],
    departamentoTransformacion: String,
    jwtInvalid: [String],
    estacionesDeEscaneo: [
      {
        departamento: String,
        usuarios: [String],
        ponerATrabajar: { $type: Boolean, default: false },
        recibirTodo: { $type: Boolean, default: false },
        ponerATrabajarConMaquina: { $type: Boolean, default: false },
        maquinas:[String],
        registrarTodo: { $type: Boolean, default: false },
        ultimoDepartamento: { $type: Boolean, default: false },
        //QuestionBase in GUI
        inputsFormulario: [
          {
            value: String,
            key: String,
            label: String,
            required: Boolean,
            order: Number,
            controlType: String,
            type: String,
            classForGroup: String,
            mask: String,
            thousandSeparator: String,
            suffix: String,
          },
        ],
      },
    ],

    actualizaciones: {
      partes: { $type: Boolean, default: false },
    },
  },
  { collection: "parametrosDeTrabajo", typeKey: "$type" }
)

module.exports = mongoose.model(
  "parametrosDeTrabajo",
  parametrosDeTrabajoSchema
)
