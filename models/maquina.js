var mongoose = require("mongoose")
var uniqueValidator = require("mongoose-unique-validator")
var gastoConsumo = require("../models/costos/gastoConsumo")
var Proceso = require("../models/procesos/proceso")
var colores = require("../utils/colors")
var NombreAnteriorMaquinaShchema = require("../models/nombreAnteriorMaquina")
var Schema = mongoose.Schema

var Trayecto = require("../models/folios/trayecto")
const ordenLigeraModel = require("./ordenLigera.model")

var maquinaSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [
        true,
        "El nombre de la máquina no puede estar vacio. Define un nombre.",
      ],
    },
    clave: {
      type: String,
      required: [
        true,
        "Es importante definir el nombre en clave. Si no lo tiene repite el nombre por favor.",
      ],
      unique: [true, "La clave de la maquina no se puede repetir."],
    },
    anio: {
      type: Number,
      min: [1950, "El año de fabricación no puede ser anterior a 1950."],
      max: [
        new Date().getFullYear() + 2,
        `El año de fabricación no puede ser superior a ${
          new Date().getFullYear() + 2
        }`,
      ],
    },

    nombresAnteriores: { type: [NombreAnteriorMaquinaShchema], default: [] },

    departamentos: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Departamento",
        },
      ],
      validate: [
        a => {
          return a.length >= 1
        },
        "El campo debe tener por lo menos un departamento definido.",
      ],
    },
    numeroDeSerie: { type: String },
    observaciones: { type: String },

    //Debemos aplicar el PEPS. Estas ordenes no necesariamente
    //deben estar en transformacion
    pila: [require("./ordenLigera.model")],

    trabajando: Boolean,
    trabajo: {
      inicio: Date,
      datos: require("./ordenLigera.model"),
    },

    trabajado: [
      {
        inicio: Date,
        finalizacion: { type: Date, default: Date.now },
        datos: require("./ordenLigera.model"),
      },
    ],
    parada: { type: Boolean, default: false },
    paro: {
      tipo: String,
      observacion: String,
      inicio: {
        type: Date,
        default: Date.now(),
      },
      finalizacion: Date,
    },
    paros: [
      {
        tipo: String,
        observacion: String,
        inicio: Date,
        finalizacion: Date,
      },
    ],
  },
  { collection: "maquinas" }
)

maquinaSchema.plugin(uniqueValidator, {
  message: "El campo '{PATH}' debe ser único.",
})

/**
 * Popula los valores de la maquina .
 *
 * @param {*} next
 */
var autoPopulate = function (next) {
  this.populate("departamentos")
  next()
}

/**
 *Esta funcion comprueba si el objeto fue modificado en sus propiedades
 nombre y clave. Si asi fue almacena un regisro dentro de nombresAnteriores. 
 *
 * @param {*} next
 */
var almacenarNombreAntiguo = function (next) {
  // ESTE PRE SOLO SE LANZA SI NO ES UN NUEVO DOCUMENTO.
  if (this.isNew) {
    next()
    return
  }

  // Comprobamos si alguno de las propiedades de interess fue modificada.
  if (this.isModified("nombre") || this.isModified("clave")) {
    // Si el arreglo esta vacio creamos uno nuevo.
    if (!this.nombresAnteriores) this.nombresAnteriores = []

    // Buscamos el nombre original.
    mongoose.models.Maquina.findById(this._id)
      .then(maquina => {
        // Por si llegara ha haber un error que no creol.
        if (!maquina) {
          throw next(
            new Error(
              "Hubo un error fatal. Al parecer no existe el id de la maquina"
            )
          )
        }

        // Seteamos el nombre original en los nombres anteriores.
        this.nombresAnteriores.push({
          nombre: maquina.nombre,
          clave: maquina.clave,
          createAt: new Date(),
        })

        next()
      })
      .catch(err => {
        next(err)
      })
  } else {
    next()
  }
}

/**
 *Elimina las relaciones que haya con la maquina.
 *
 * @param {*} next
 */
var eliminarRelacionados = function (next) {
  // Obtenemos el id.
  let idEliminar = this._id

  let promesas = []

  let procesosPull = {
    $pull: {
      maquinas: idEliminar,
    },
  }

  promesas.push(Proceso.update({ maquinas: idEliminar }, procesosPull))

  Promise.all(promesas)
    .then(resp => {
      console.log(
        `${colores.success(
          "CORRECTO"
        )}  Datos relacionados eliminados ${JSON.stringify(resp)}`
      )
      next()
    })
    .catch(err => {
      next(err)
    })
}

maquinaSchema
  .pre("find", autoPopulate)
  .pre("findOne", autoPopulate)
  .pre("findById", autoPopulate)
  .pre("remove", eliminarRelacionados)
  .pre("save", almacenarNombreAntiguo)

module.exports = mongoose.model("Maquina", maquinaSchema)
