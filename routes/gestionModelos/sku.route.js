//Esto es necesario
const express = require("express")

const SKU = require("../../models/sku.model")
const app = express()
const $ = require("@codice-progressio/easy-permissions").$
// const fs = require("fs")
// const upload = require("multer")({ dest: "uploads/sku/", fileFilter })
// Libreria para convertir imagenes

const Parametros = require("../../models/defautls/parametros.model")

const easyImages = require("@codice-progressio/easy-images")

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

app.post("/", $("sku:crear", "Crea un nuevo SKU"), (req, res, next) => {
  let s = new SKU(req.body)

  s.lotes.push({
    existencia: 0,
    observaciones: "[ SISTEMA ] Lote creado sin existencia",
    movimientos: [
      {
        cantidad: 0,
        esEntrada: true,
        observaciones: "[ SISTEMA ] Movimiento creado sin existencias",
        usuario: req.user._id,
      },
    ],
  })

  s.save()
    .then(sku => {
      return res.send(sku)
    })
    .catch(err => next(err))
})

//Agregamos una imagen al sku
app.put(
  "/imagen",
  $("sku:imagen:agregar", "Agregar una imagen al SKU"),
  easyImages.recibirImagen.single("img"),
  easyImages.redimencionarMiddleware,
  async (req, res, next) => {
    const sku = await SKU.findById(req.body._id).exec()
    if (!sku) throw next(new Error("No existe el id"))
    let publicUrl = ""
    easyImages
      .subirImagen(req.file)
      .then(data => {
        publicUrl = data.publicUrl
        sku.imagenes.push({
          nombreOriginal: req.file.originalname,
          nombreBD: data.nuevoNombre,
          path: data.publicUrl,
        })
        return sku.save()
      })
      .then(sku => {
        res.send(sku.imagenes.find(x => x.path === publicUrl))
      })
      .catch(_ => {
        next(_)
      })
  }
)

//Eliminamos una imagen
app.delete(
  "/imagen/:id/:idImg",
  $("sku:imagen:eliminar", "Eliminar una imagen del sku"),
  async (req, res, next) => {
    // El id del sku
    let id = req.params.id
    // El id del arreglo donde esta la imagen.
    let idImg = req.params.idImg

    // Buscamos por id
    SKU.findById(id)
      .exec()
      .then(async sku => {
        if (!sku) throw "No existe el id"

        // Obtenemos la img guardada.
        let imgDB = sku.imagenes.id(idImg)
        if (!imgDB) throw "No existe la imagen"

        try {
          await easyImages.eliminarImagenDeBucket(imgDB.nombreBD)
        } catch (error) {
          throw next(error)
        }
        // // Si la imagen no existe, debemos continuar con la iliminacion
        // // del registro. Por eso comprobamos que existan ambos.
        // if (fs.existsSync(imgDB.path)) fs.unlinkSync(imgDB.path)

        // Pull elimina del arreglo el id que le pasemos relacionado al objeto.
        sku.imagenes.pull(idImg)
        return sku.save()
      })
      .then(sku => res.send(sku))
      .catch(_ => next(_))
  }
)

app.get(
  "/",
  $("sku:leer:todo", "Muestra los datos generales de los sku"),
  async (req, res, next) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombreCompleto")

    SKU.find({ eliminado: false })
      .limit(limite)
      .skip(desde)
      .sort({ [campo]: sort })
      .exec()
      .then(sku => res.send(sku))
      .catch(_ => next(_))
  }
)
app.get(
  "/todo",
  $(
    "sku:leer:todo:lista-de-precios",
    "Leer todos los sku registrados en la BD"
  ),
  async (req, res, next) => {
    SKU.find()
      .select(
        " -produccion -imagenes -existenciaAlmacenes -lotes -proveedores "
      )
      .exec()
      .then(skus => res.send({ skus }))
      .catch(_ => next(_))
  }
)

app.get(
  "/buscar/id/:id",
  $("sku:leer:id", "Obtiene un sku por su id"),
  (req, res, next) => {
    SKU.findById(req.params.id)
      .exec()
      .then(sku => {
        if (!sku) throw "No existe el id"
        return res.send(sku)
      })
      .catch(_ => next(_))
  }
)

app.get(
  "/buscar/termino/:termino",
  $("sku:leer:termino"),
  async (req, res, next) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombreCompleto")
    const termino = String(
      req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    const b = campo => ({
      [campo]: { $regex: termino, $options: "i" },
    })

    const $match = {
      eliminado: false,
      $or: [],
    }

    ;["nombreCompleto", "descripcion", "codigo"].forEach(x =>
      $match.$or.push(b(x))
    )

    SKU.aggregate([
      { $match },
      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } },
      {
        $project: {
          nombreCompleto: "$nombreCompleto",
          descripcion: "$descripcion",
          unidad: "$unidad",
          existencia: "$existencia",
          stockMaximo: "$stockMaximo",
          stockMinimo: "$stockMinimo",
          etiquetas: "$etiquetas",
          imagenes: "$imagenes",
          costoVenta: "$costoVenta",
          codigo: "$codigo",
        },
      },
    ])
      .exec()
      .then(sku => res.send(sku))
      .catch(err => next(err))
  }
)

app.get("/buscar/etiquetas", (req, res, next) => {
  let etiquetas = req.query.etiquetas.split(",")

  SKU.find({ eliminado: false, etiquetas: { $all: etiquetas } })
    .exec()
    .then(skus => res.send(skus))
    .catch(_ => next(_))
})

app.get("/buscar/codigo/:codigo", (req, res, next) => {
  let codigo = req.params.codigo
  SKU.findOne({
    eliminado: false,
    // puedoVenderlo: true,
    codigo: codigo,
  })
    .select(" id nombreCompleto costoVenta codigo puedoVenderlo")
    .exec()
    .then(skus => {
      if (!skus.puedoVenderlo) throw "Producto no apto para venta al público"
      res.send(skus)
    })
    .catch(_ => next(_))
})

app.put("/", $("sku:modificar", "Modificar sku"), (req, res, next) => {
  SKU.findById(req.body._id)
    .exec()
    .then(sku => {
      if (!sku)
        throw "No existe el sku"
        // Campos modificables.
      ;[
        "nombreCompleto",
        "unidad",
        "descripcion",
        "puedoProducirlo",
        "puedoComprarlo",
        "puedoVenderlo",
        "costoVenta",
        "codigo",
      ].forEach(x => (sku[x] = req.body[x]))

      return sku.save()
    })
    .then(sku => res.send(sku))
    .catch(err => next(err))
})

app.put(
  "/minimo-maximo",
  $("sku:modificar:stock-mimimo-maximo", "Modificar el stock minimo y maximo"),
  (req, res, next) => {
    SKU.findById(req.body._id)
      .exec()
      .then(sku => {
        if (!sku)
          throw "No existe el sku"
          // Campos modificables.
        ;["stockMinimo", "stockMaximo"].forEach(x => (sku[x] = req.body[x]))

        return sku.save()
      })
      .then(sku =>
        res.send({
          stockMaximo: sku.stockMaximo,
          stockMinimo: sku.stockMinimo,
        })
      )
      .catch(err => next(err))
  }
)
app.put(
  "/agregar-etiqueta",
  $("sku:modificar:agregar-etiqueta"),
  async (req, res, next) => {
    try {
      // Existe el sku
      const sku = await SKU.findById(req.body._id).exec()
      if (!sku) throw "No existe el sku"

      // Comprobamos la etiqueta si esta registrada

      await Parametros.crearEtiquetaSiNoExiste(req.body.etiqueta)
      sku.etiquetas.push(req.body.etiqueta)

      const skuGuardado = await sku.save()
      return res.send(skuGuardado)
    } catch (error) {
      next(error)
    }
  }
)

app.delete("/:id", $("sku:eliminar"), async (req, res, next) => {
  SKU.findById(req.params.id)
    .exec()
    .then(sku => {
      if (!sku) throw "No existe el sku"

      // // Elimimanos todas las imagenes.
      // let promesas = sku.imagenes.map(x =>
      //   easyImages.eliminarImagenDeBucket(x.nombreBD)
      // )

      // return Promise.all(promesas).then(() => sku.remove())
      sku.eliminado = true
      return sku.save()
    })
    .then(sku => res.send(sku))
    .catch(err => next(err))
})

app.delete(
  "/:id/etiqueta/:etiqueta",
  $("sku:eliminar:etiqueta"),
  (req, res) => {
    SKU.findById(req.params.id)
      .exec()
      .then(sku => {
        if (!sku) throw "No existe el sku"
        sku.etiquetas.pull(req.params.etiqueta)
        return sku.save()
      })
      .then(sku => res.send(sku))
      .catch(err => erro(res, err, "Hubo un error eliminando el sku"))
  }
)

// function recalcularExistencia(sku) {
//   // Recalculamos la existencia.
//   let existenciaActual = 0
//   // Recorremos cada entrada de cada lote para saber
//   // Que tipo de movimento es.
//   sku.lotes.forEach(lote => {
//     lote.existencia = lote.movimientos.reduce(
//       (pre, cur) =>
//         cur.esEntrada ? (pre += cur.cantidad) : (pre -= cur.cantidad),
//       0
//     )

//     existenciaActual += lote.existencia
//   })

//   return existenciaActual
// }

// function recalcularExistenciaPorAlmacenes(sku) {
//   // Creamos un nuevo objeto para guardar el calculo de los diferentes
//   // almacenes. La clave debe ser el id del almacen seguido de
//   // la cantidad.
//   // { idAlmacen: 120 }
//   sku.lotes.forEach(lote => {
//     lote.existenciaAlmacenes = lote.movimientos.reduce((pre, cur) => {
//       // Si no existe el id del almacen, lo creamos
//       if (!pre.hasOwnProperty(cur.almacen)) pre[cur.almacen] = 0

//       // Acumulados directamente al id.
//       pre[cur.almacen] = cur.esEntrada
//         ? (pre[cur.almacen] += cur.cantidad)
//         : (pre[cur.almacen] -= cur.cantidad)

//       return pre
//     }, {})
//   })

//   // Sumamos todas las existencias de cada lote por almacen.
//   let almacenesSuma = {}
//   sku.lotes.forEach(lote => {
//     Object.keys(lote.existenciaAlmacenes).forEach(keyIdAlmacen => {
//       // Debe de existir el id
//       if (!almacenesSuma.hasOwnProperty(keyIdAlmacen))
//         almacenesSuma[keyIdAlmacen] = 0
//       // Solo necesitamos sumar por que aqui todo deberia ser positivo.
//       almacenesSuma[keyIdAlmacen] += lote.existenciaAlmacenes[keyIdAlmacen]
//     })
//   })

//   sku.existenciaAlmacenes = almacenesSuma
// }

// Crea un nuevo lote en el sku
app.post(
  "/lote/crear/:id",
  $("sku:lote:crear", "Crear lotes nuevos"),
  (req, res, next) => {
    SKU.findById(req.params.id)
      .select("lotes")
      .exec()
      .then(sku => {
        if (!sku) throw next("No existe el id")

        // Para hacernos la vida mas facil podemos crear
        // lotes sin una existencia dada. Aqui capturamos eso
        // creando un nuevo movimiento en 0 que represente
        // la primera entrada del lote.Si definimos el movimiento
        // si lo registramos de todas maneras.

        if (!req.body.movimientos) {
          req.body["movimientos"] = [
            {
              cantidad: 0,
              esEntrada: true,
              observaciones: "[SISTEMA] Lote creado sin existencias",
              // //Agregamos el usuario actual
              usuario: req.user._id,
            },
          ]
        }
        // Si se mandaran mas movimientos recorremos todos.
        req?.body?.movimientos?.forEach(x => (x.usuario = req.user._id))
        sku.lotes.unshift(req.body)
        sku.recalcularExistencia()

        return sku.save()
      })
      .then(sku =>
        // Solo retornamos el nuevo cambio para
        // hacer la modificacion
        res.send({
          _id: sku._id,
          lotes: [sku.lotes.shift()],
        })
      )
      .catch(_ => next(_))
  }
)

app.get("/lote/:id", (req, res, next) => {
  SKU.findById(req.params.id)
    .select("lotes nombreCompleto")
    .lean()
    .exec()
    .then(sku => {
      if (!sku) throw "No existe el id"

      // Por defecto no vemos los lotes con existencia.
      if (req.query.sinExistencia)
        sku.lotes = sku.lotes.filter(x => x.existencia > 0)
      // Solo contiene id y lotes
      return res.send(sku)
    })
    .catch(_ => next(_))
})

app.get("/lote/movimientos/:id", (req, res, next) => {
  SKU.findById(req.params.id)
    .select("lotes nombreCompleto")
    .populate("lotes.movimientos.usuario", "nombre email", "Usuario")
    .lean()
    .exec()
    .then(sku => {
      if (!sku) throw "No existe el id"

      // Por defecto no vemos los lotes con existencia.
      if (req.query.sinExistencia)
        sku.lotes = sku.lotes.filter(x => x.existencia > 0)

      // Reestructuramos
      const modificado = sku.lotes
        .map(lote => {
          const json = {
            idLote: lote._id,
            loteExistencia: lote.existencia,
            // existenciaAlmacenes: {},
            loteObservaciones: lote.observaciones,
            ...separarFecha(lote.createdAt, "loteCreado"),
            ...separarFecha(lote.caducidad, "loteCaducidad"),
          }

          return lote.movimientos.map(movimiento => {
            delete movimiento._id

            const usuario = movimiento.usuario
            delete usuario._id
            delete movimiento.usuario

            // Convertimos a positivo o negativo para mas comididad
            movimiento.cantidad =
              (movimiento.esEntrada ? 1 : -1) * movimiento.cantidad

            movimiento = {
              ...movimiento,
              ...separarFecha(movimiento.createdAt, "movCreado"),
            }
            delete movimiento.createdAt

            return { ...json, ...movimiento, ...usuario }
          })
        })
        .reduce((acumulador, actual) => acumulador.concat(actual), [])

      return res.send(modificado)
    })
    .catch(_ => next(_))
})

function obtenerFechaSeparada(fecha) {
  const f = new Date(fecha)
  return {
    dia: f.getDate(),
    mes: f.getMonth() + 1,
    anio: f.getFullYear(),
    hora: f.getHours(),
    minuto: f.getMinutes(),
  }
}

function separarFecha(fecha, prefijo) {
  const objeto = {}
  const f = obtenerFechaSeparada(fecha)
  ;["dia", "mes", "anio", "hora", "minuto"].forEach(x => {
    objeto[`${prefijo}_${x}`] = f[x]
  })
  return objeto
}

// Crea un movimento  lote seleccionado
app.put(
  "/lote/movimiento/agregar/:id/:idLote/",
  $("sku:lote:movimiento:Agregar", "Agregar entradas o salidas a un lote."),
  (req, res, next) => {
    let id = req.params.id
    let idLote = req.params.idLote
    let movimientos = req.body
    let user = req.user

    SKU.agregarMovimiento({ id, idLote, movimientos, user })
      .then(x => res.send(x))
      .catch(_ => next(_))
  }
)
// Elimina un movimento y recalcula el valor de las existencias.
app.delete(
  "/lote/movimiento/eliminar/:id/:idLote/:idMovimiento",
  $("sku:lote:movimiento:Eliminar", "Eliminar movimentos de un lote"),
  (req, res, next) => {
    let id = req.params.id
    let idLote = req.params.idLote
    let idMovimiento = req.params.idMovimiento

    SKU.eliminarMovimiento(id, idLote, idMovimiento)
      .then(x => res.send(x))
      .catch(_ => next(_))
  }
)

app.put(
  "/lote/movimiento/transferir-entre-almacenes/:id/:lote",
  $(
    "sku:lote:movimiento:transferir-entre-almacenes",
    "Hacer transfericias entre dos almacenes."
  ),
  (req, res, next) => {
    let id = req.params.id
    let lote = req.params.lote

    SKU.findById(id)
      .select("lotes")
      .exec()
      .then(sku => {
        if (!sku) throw "No existe el id"
        if (!sku.lotes.id(lote)) throw "No existe el lote"

        // Resibimos un movimiento marcado como salida.

        let salidaAlmacen = req.body.salida
        salidaAlmacen.usuario = req.user._id
        // Siempre debe ser una salida.
        salidaAlmacen.esEntrada = false
        let almacenObjetivo = req.body.almacenObjetivo

        // Creamos el nuevo moviento de entrada al almacen almacenObjetivo

        let entradaAlmacen = {
          cantidad: salidaAlmacen.cantidad,
          // salidaDeAlmacenActual.//,
          esEntrada: true,
          observaciones: "[ TRANSFERENCIA ]" + req.body.observaciones,
          usuario: req.user._id,
          almacen: almacenObjetivo,
        }
        sku.lotes.id(lote).movimientos.push(salidaAlmacen)
        sku.lotes.id(lote).movimientos.push(entradaAlmacen)

        sku.recalcularExistencias()

        return sku.save()
      })
      .then(sku => res.send(sku))
      .catch(_ => next(_))
  }
)
// Modifica el movimiento seleccinado y recalcula el valor de las existencias.
app.put(
  "/lote/movimiento/modificar/:id/:idLote/:idMovimiento",
  $("sku:lote:movimiento:modificar", "Modificar un movimento existente"),
  (req, res, next) => {
    let id = req.params.id
    let idLote = req.params.idLote
    let idMovimiento = req.params.idMovimiento

    SKU.findById(id)
      .select("lotes")
      .exec()
      .then(sku => {
        if (!sku) throw "No existe el id"
        let lote = sku.lotes.id(idLote)
        if (!lote) throw "No existe el lote"
        let movimiento = lote.movimientos.id(idMovimiento)
        if (!movimiento) throw "No existe el movimiento"

        movimiento.cantidad = req.body.cantidad
        movimiento.esEntrada = req.body.esEntrada
        movimiento.observaciones = req.body.observaciones
        movimiento.usuario = req.user._id

        sku.recalcularExistencia()
        return sku.save()
      })
      .then(x => res.send(x))
      .catch(_ => next(_))
  }
)
// Elimina el lote seleccionado y afecta la cantidad total del sku
app.delete(
  "/lote/eliminar/:id/:idLote",
  $("sku:lote:eliminar", "Eliminar lotes completamente"),
  (req, res, next) => {
    let id = req.params.id
    let idLote = req.params.idLote

    SKU.findById(id)
      .select("lotes")
      .exec()
      .then(sku => {
        if (!sku) throw "No existe el id"
        let lote = sku.lotes.id(idLote)
        if (!lote) throw "No existe el lote"

        sku.lotes.pull(idLote)

        sku.recalcularExistencia()
        return sku.save()
      })
      .then(x => res.send(x))
      .catch(_ => next(_))
  }
)
// Modifica los datos del lote. Ejecuta un recalculo de las existencias
// del sku.
app.put("/lote/modificar/:id/:idLote/", (req, res, next) => {
  let id = req.params.id
  let idLote = req.params.idLote

  SKU.findById(id)
    .select("lotes")
    .exec()
    .then(sku => {
      if (!sku) throw "No existe el id"
      let lote = sku.lotes.id(idLote)
      if (!lote) throw "No existe el lote"

      lote.observaciones = req.body.observaciones
      lote.caducidad = req.body.caducidad

      sku.recalcularExistencia()
      return sku.save()
    })
    .then(x => res.send(x))
    .catch(_ => next(_))
})

module.exports = app
