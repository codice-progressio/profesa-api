const mongoose = require("mongoose")
const Schema = mongoose.Schema

const salidaLoteSchema = new Schema(
  {
    /**
     * Se utiliza para que no se validen todos los volres
     * del array cada vez que los guardamos. Asi nos saltamos la
     * validacions para las demas entradas que estamos
     * manejando al par con este objeto ( Se hace desde lote.js en el methods.addSalida )
     */
    validando: { type: Boolean, default: false, select: false },
    /**
     * El cliente al que se le va a surtir el boton.
     */
    cliente: {
      type: Schema.Types.ObjectId,
      ref: "Cliente",
      required: [true, "El cliente es necesario"],
    },
    observaciones: { type: String },
    cantidad: {
      type: Number,
      validate: [
        {
          validator: function (v) {
            return new Promise(resolve => {
              // El valor minimo no puede ser menor que 1;
              resolve(1 <= v)
            })
          },
          msg:
            "El valor que ingresaste ( {VALUE} ) es menor que el permitido ( 1 ).",
        },
        {
          /**
           * Esta funcion valida que la cantidad que se va a registrar como salida
           * no supera la existencia actual que hay. Es necesario hacer un pequeno hackj
           * por que el pre hook save que tenemos para calcular la existencia modifica
           * el atributo antes de antrat aqui y no podemos comparar correctamente. Para
           * eso sumanos el valor ingresaso a la existencia y tenemos la existencia
           * actual.
           *
           * @param {number} v El valor que recivimos desde el validador(Que ingreso el usuario.)
           * @param {any} cb El callback que genera mongoose y que nos permite agregar el mensaje personalizado.
           */
          validator: function (v, cb) {
            // #isAsync
            return new Promise((resolve, reject) => {
              if (this.parent().validandoDevolucion) {
                // Si estmamos validando una devolucion entonces no entramos aqui.
                resolve(true)
              } else {
                if (this.validando) {
                  // Corregimos por que se aplica el pre donde calcula los totales
                  // en el pre save. Que es antes de entrar a validar. Por tanto
                  // sumamos el valor ingresado para volver a la existencia actual.
                  let existencia = this.parent().existencia + v

                  let msjError = ""
                  let pasoValidacion = true

                  /**
                   * El lote no tiene existencia.
                   */
                  if (existencia <= 0) {
                    msjError = `Este lote no tiene existencias.`
                    pasoValidacion = false
                  } else if (existencia < v) {
                    /**
                     * Si la existencia es menor
                     * que la cantidad que va a dar salida
                     * manda error.
                     *
                     * */
                    msjError = `El valor que ingresaste ( ${v} ) es mayor que la existencia ( ${existencia} ) de este lote.`
                    pasoValidacion = false
                  }
                  this.validando = false
                  resolve(pasoValidacion, msjError)
                } else {
                  resolve(true)
                }
              }
            })
          },
        },
      ],
    },
  },
  { timestamps: true }
)

module.exports = salidaLoteSchema
