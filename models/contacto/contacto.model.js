const mongoose = require("mongoose")
const Schema = mongoose.Schema
const DomicilioSchema = require("./domicilio.model")

// ESTO SE VA A CONVERTIR EN UN CONTACTO
const ContactoSchema = new Schema(
  {
    codigo: {
      type: String,
      trim: true,
      index: {
        unique: true,
        partialFilterExpression: { codigo: { $type: "string" } },
      },
    },
    razonSocial: { type: String, min:1 },
    nombre: { type: String, min:1 },
    domicilios: [DomicilioSchema],
    contactos: [
      {
        nombre: String,
        telefono: [String],
        correo: [String],
        puesto: [String],
      },
    ],
    rfc: { type: String },
    cuentas: [
      {
        clabe: Number,
        cuenta: Number,
        banco: String,
      },
    ],
    // Establece como eliminado el proveedor. Esto sirve
    // para que las referencias como las compras
    // por precio de proveedor no se vean afectadas
    // al eliminar todos los datos relacionados con el proveedor.
    eliminado: { type: Boolean, default: false, select: false },
    esCliente: Boolean,
    esProveedor: Boolean,
    etiquetas: [String],
    rutas: [String],
    usuariosAsignados: [String],

    listaDePrecios: { type: mongoose.Types.ObjectId, ref: "ListaDePrecios" },
  },
  { collection: "contactos" }
)
module.exports = mongoose.model("Contacto", ContactoSchema)
