let mongoose = require("mongoose")

let uniqueValidator = require("mongoose-unique-validator")
let colores = require("../../utils/colors")
let folioLineaSchema = require("./folioLinea")
let NVU = require("../../config/nivelesDeUrgencia")
let Schema = mongoose.Schema
let CONST = require("../../utils/constantes")

let RESP = require("../../utils/respStatus")
let AutoIncrement = require("mongoose-sequence")(mongoose)
// schmea. (key) no es obligatorio el nivel en el folio.
delete NVU.KEY.required
//Para este folio el nivel de urgencia por default debe ser almacen.

NVU.KEY.default = NVU.LV.A //ALMACEN

let FolioSchema = new Schema(
  {
    numeroDeFolio: { type: Number, unique: true },
    cliente: {
      type: Schema.Types.ObjectId,
      ref: "Cliente",
      required: [true, "El cliente es necesario"]
    },
    fechaFolio: { type: Date, default: Date.now },
    fechaEntrega: { type: Date, default: null },
    vendedor: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: [true, "El vendedor es necesario"]
    },
    observaciones: { type: String },
    observacionesVendedor: { type: String },
    /**
     * Esta bandera se pone en true cuando las modificaciones al folio se terminador
     * y se pasa el control a control de produccion.
     */
    entregarAProduccion: { type: Boolean, default: false },
    fechaDeEntregaAProduccion: {
      type: Date,
      required: [
        () => {
          return this.entregarAProduccion
        },
        "Es necesario que definas la fecha de entrega a produccion."
      ]
    },
    // folioLineas: [{ type: Schema.Types.Mixed, ref: 'FolioLinea' }]
    folioLineas: [folioLineaSchema],
    porcentajeAvance: { type: Number, min: 0, max: 100 },
    ordenesGeneradas: { type: Boolean, default: false },
    impreso: { type: Boolean, default: false },
    terminado: { type: Boolean, default: false },
    fechaTerminado: { type: Date, default: null },
    cantidadProducida: { type: Number, default: 0 }
  },
  { collection: "folios", timestamps: true }
)

FolioSchema.plugin(uniqueValidator, { message: "'{PATH}' debe ser único." })
FolioSchema.plugin(AutoIncrement, {
  id: "numeroDeFolio_seq",
  inc_field: "numeroDeFolio"
})

let autoPopulate = function(next) {
  this.populate("cliente", "sae nombre")
  this.populate("vendedor", "nombre")
  this.populate({
    path: "folioLineas.modeloCompleto",
    populate: {
      path: "modelo tamano color terminado"
    }
  })

  let populantes = ["ubicacionActual", "trayectoNormal", "trayectoRecorrido"]

  populantes.forEach(pop => {
    this.populate(`folioLineas.ordenes.${pop}.departamento`)
    this.populate(`folioLineas.ordenes.${pop}.laser.maquinaActual`)
    this.populate(`folioLineas.ordenes.${pop}.transformacion.maquinaActual`)
    this.populate(`folioLineas.ordenes.${pop}.materiales.maquinaActual`)
  })

  this.populate("folioLineas.ordenes.siguienteDepartamento.departamento")
  this.populate("folioLineas.ordenes.modeloCompleto")
  this.populate("folioLineas.procesos.proceso")

  this.populate("cliente")
  next()
}

FolioSchema.pre("findOne", autoPopulate).pre("findById", autoPopulate)

module.exports = mongoose.model("Folio", FolioSchema)
