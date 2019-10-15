const mongoose = require("mongoose")
const Schema = mongoose.Schema


const CursoModelSchema = new Schema(
  {
    nombre: String,
    fechaDeCurso: Date,
    duracion: Number,
    instructor: String,
    descripcionDeCurso: String,
    //Es obligatorio
    cursoDeTroncoComun: Boolean,
    cursoDeEspecializacion: Boolean,
    asistencias: [
      {
        empleado: {
          type: Schema.Types.ObjectId,
          ref: "Empleado"
        },
        fecha: Date
      }
    ]
  },
  { collection: "cursos" }
)

/**
 * Primero buscamos el curso y luego encadenamos con este
 * valor.
 * 
 */
CursoModelSchema.methods.agregarAsistenciaATodos = function(
  arregloDeIdDeEmpleados
) {

  for (let i = 0; i < arregloDeIdDeEmpleados.length; i++) {
    const idEmpleado = arregloDeIdDeEmpleados[i];
    this.asistencias.push({
      empleado: Schema.ObjectId(idEmpleado), 
      date: new Date()
    })
    

    return this.save()
  }





}

module.exports = mongoose.model("Curso", CursoModelSchema)
