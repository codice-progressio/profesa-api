const mongoose = require("mongoose")
const Schema = mongoose.Schema

const CursoModelSchema = new Schema(
  {
    fechaDeCurso: Date,
    duracion: Number,
    instructor: String,
    descripcionDeCurso: String,
    //Es obligatorio
    cursoDeTroncoComun: Boolean,
    cursoDeEspecializacion: Boolean
  },
  { collection: "cursos" }
)

module.exports = mongoose.model("Curso", CursoModelSchema)
