const mongoose = require("mongoose")
const Schema = mongoose.Schema
const DomicilioSchema = require("./domicilio.model")
const ProveedorSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
    },
    razonSocial: { type: String },
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
  },
  { collection: "proveedores" }
)
module.exports = mongoose.model("Proveedor", ProveedorSchema)
