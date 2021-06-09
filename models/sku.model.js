const mongoose = require("mongoose")
const Schema = mongoose.Schema
const loteSchema = require("./almacenProductoTerminado/lote.model")
const imagenSchema = require("./imagen.model")
const sku = new Schema({
  eliminado: {
    type: Boolean,
    default: false,
  },
  puedoProducirlo: { type: Boolean, default: false },
  puedoComprarlo: { type: Boolean, default: false },
  puedoVenderlo: { type: Boolean, default: false },
  //Para el codigo de barras
  codigo: {
    type: String,
    trim: true,
    index: {
      unique: true,
      partialFilterExpression: { codigo: { $type: "string" } },
    },
  },

  produccion: {
    //La familia de procesos es una agrupación de todos los procesos que conlleva este sku cuando se produce. .
    familiaDeProcesos: {
      type: Schema.Types.ObjectId,
      ref: "FamiliaDeProcesos",
    },

    bom: [
      {
        material: String,
        factor: { type: Number, min: [0, "El mínimo es 0"] },
      },
    ],
  },

  unidad: String,
  descripcion: String,
  imagenes: [imagenSchema],

  nombreCompleto: {
    type: String,
    unique: [true, "{{PATH}} Debe ser único"],
    minlength: 4,
  },

  /**
   * La existencia de sku en el almacen.
   * Esta se actualiza automaticamente cuando se
   * se guarda la salida de sku o entra un nuevo lote.
   */
  existencia: { type: Number, default: 0 },

  // La suma de la existencia de los almacenes
  // tomando en cuenta los que esten divididos entre
  // lotes diferentes.
  existenciaAlmacenes: {},

  /**
   * Los lotes de este sku. Ver schema para mas info.
   */
  lotes: {
    type: [loteSchema],
    select: false,
  },

  costoVenta: { type: Number, min: 0, default: 0 },
  proveedores: {
    select: false,
    type: [
      {
        idProveedor: String,
        costo: { type: Number, min: 0 },
      },
    ],
  },

  // Valores para las existencias.
  stockMinimo: { type: Number, default: 0, min: 0 },
  stockMaximo: {
    type: Number,
    default: 0,
    valildate: [
      {
        validator: function (v) {
          return new Promise(resolve => {
            // Puede definirse como maximo 0 para que no se gestione
            resolve(this.stockMinimo >= v)
          })
        },
        msg: "El valor maximo de stock no puede ser menor que el valor minimo de stock",
      },
    ],
  },
  etiquetas: [
    {
      type: String,
      minlength: [4, "La etiqueta debe contener por lo menos 4 caracteres"],
    },
  ],
})

// Agregamos un movimiento al almacen
/**
 *
 *
 * @param {*} opciones{
 * id = req.params.id
 * idLote = req.params.idLote
 * movimientos = req.body
 * user = req.user
 *
 * }
 * @returns
 */
sku.statics.agregarMovimiento = function (opciones) {
  return this.findById({ _id: opciones.id })
    .select("lotes")
    .exec()
    .then(sku => {
      if (!sku) throw "No existe el id"
      let lote = sku.lotes.id({ _id: opciones.idLote })
      if (!lote) throw "No existe el lote"

      opciones.movimientos.usuario = opciones.user._id
      lote.movimientos.push(opciones.movimientos)

      sku.recalcularExistencia()
      sku.recalcularExistenciaPorAlmacenes()
      return sku.save()
    })
}

sku.statics.eliminarMovimiento = function (id, idLote, idMovimiento) {
  SKU.findById(id)
    .select("lotes")
    .exec()
    .then(sku => {
      if (!sku) throw "No existe el id"
      let lote = sku.lotes.id(idLote)
      if (!lote) throw "No existe el lote"
      let movimiento = lote.movimientos.id(idMovimiento)
      if (!movimiento) throw "No existe el movimiento"

      sku.lotes.id(idLote).movimientos.pull(idMovimiento)

      sku.recalcularExistencia()
      
      return sku.save()
    })
}

// Recalcula las existencias totales del almacen

sku.methods.recalcularExistencia = function () {
  // Recalculamos la existencia.
  let existenciaActual = 0
  // Recorremos cada entrada de cada lote para saber
  // Que tipo de movimento es.
  this.lotes.forEach(lote => {
    lote.existencia = lote.movimientos.reduce(
      (pre, cur) =>
        cur.esEntrada ? (pre += cur.cantidad) : (pre -= cur.cantidad),
      0
    )

    existenciaActual += lote.existencia
  })

  this.existenciaActual = existenciaActual
  this.recalcularExistenciaPorAlmacenes()
}

//
sku.methods.recalcularExistenciaPorAlmacenes = function () {
  // Creamos un nuevo objeto para guardar el calculo de los diferentes
  // almacenes. La clave debe ser el id del almacen seguido de
  // la cantidad.
  // { idAlmacen: 120 }
  this.lotes.forEach(lote => {
    lote.existenciaAlmacenes = lote.movimientos.reduce((pre, cur) => {
      // Si no existe el id del almacen, lo creamos
      if (!pre.hasOwnProperty(cur.almacen)) pre[cur.almacen] = 0

      // Acumulados directamente al id.
      pre[cur.almacen] = cur.esEntrada
        ? (pre[cur.almacen] += cur.cantidad)
        : (pre[cur.almacen] -= cur.cantidad)

      return pre
    }, {})
  })
  // Sumamos todas las existencias de cada lote por almacen.
  let almacenesSuma = {}
  this.lotes.forEach(lote => {
    Object.keys(lote.existenciaAlmacenes).forEach(keyIdAlmacen => {
      // Debe de existir el id
      if (!almacenesSuma.hasOwnProperty(keyIdAlmacen))
        almacenesSuma[keyIdAlmacen] = 0
      // Solo necesitamos sumar por que aqui todo deberia ser positivo.
      almacenesSuma[keyIdAlmacen] += lote.existenciaAlmacenes[keyIdAlmacen]
    })
  })

  this.existenciaAlmacenes = almacenesSuma
}

module.exports = mongoose.model("sku", sku)
