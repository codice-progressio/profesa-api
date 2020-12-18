const ingrediente = {
  articulo: String,
  cantidad: Number,
  esGramosPorKilo: Boolean,
  esPorcentaje: Boolean,
  observaciones: String,
}

const capaSchema = {
  nombre: String,
  esFija: Boolean,
  cantidad: Number,
  ingredientes: [ingrediente],
  observaciones: String,
}

module.exports = capaSchema
