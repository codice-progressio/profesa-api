let mongoose = require("mongoose")

let uniqueValidator = require("mongoose-unique-validator")
let folioLineaSchema = require("./folioLinea")
let NVU = require("../../config/nivelesDeUrgencia")
let Schema = mongoose.Schema

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
      required: [true, "El cliente es necesario"],
    },
    fechaFolio: { type: Date, default: Date.now },
    fechaEntrega: { type: Date, default: null },
    vendedor: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: [true, "El vendedor es necesario"],
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
        "Es necesario que definas la fecha de entrega a produccion.",
      ],
    },
    // folioLineas: [{ type: Schema.Types.Mixed, ref: 'FolioLinea' }]
    folioLineas: [folioLineaSchema],
    porcentajeAvance: { type: Number, min: 0, max: 100 },
    ordenesGeneradas: { type: Boolean, default: false },
    impreso: { type: Boolean, default: false },
    terminado: { type: Boolean, default: false },
    fechaTerminado: { type: Date, default: null },
    cantidadProducida: { type: Number, default: 0 },
  },
  { collection: "folios", timestamps: true }
)

module.exports = mongoose.model("Folio", FolioSchema)
