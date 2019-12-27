const mongoose = require("mongoose")
const Schema = mongoose.Schema

const AreaRHSchema = new Schema(
  {
    nombre: String
  },
  { collection: "areasRH" }
)

module.exports = mongoose.model("AreaRH", AreaRHSchema)
