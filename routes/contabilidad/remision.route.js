const app = require("express")()
const sku = require("../../models/sku.model")
const Remision = require("../../models/contabilidad/remision.model")

const $ = require("@codice-progressio/express-authentication").configuraciones
  .easy_permissions.$

app.post(
  "/",
  $("contabilidad:remision:crear", "Crear una nueva remision"),
  (req, res, next) => {
    let articulos = req.body
    // Buscamos todos los sku de la nota actual y ponemos el
    // precio al momento de la consulta para que haya una comparacion
    // si se cambio el precio.
    if (!articulos) throw "No se recibieron articulos para registrarse"
    let skusIds = articulos?.map(x => x.idSku) ?? [null]
    sku
      .find({ _id: { $in: skusIds } })
      .select("+lotes")
      .exec()
      .then(skus => {
        // Modificamos los articulos para agregar los datos
        // que necesitamos.
        articulos.map(a => {
          // Buscamos el sku
          let sku = skus.find(s => s._id.toString() === a.idSku)
          if (!sku) throw next(`El '${a.idSku}' no existe`)
          // Obtenemos el precio actual.
          a.precioActual = sku.costoVenta
          return a
        })
        // Modificados los articulos creamos la nota principal

        let nRemision = new Remision()
        nRemision.usuario = req.user._id
        let total = 0
        articulos.map(x => {
          total += x.precio
          nRemision.articulos.push(x)
        })
        nRemision.total = total

        // Primero grabamos la nota
        // Con la nota guardada obtenemos su numero de remision
        // Guardamos las modificaciones a los sku

        return new Promise((resolve, reject) => {
          let remisionGuardada = null
          nRemision
            .save()
            .then(remision => {
              // Volvemos a recorrer los articulos para agregar
              // La referencia a la remision
              remisionGuardada = remision
              let promesas = []
              articulos.forEach(a => {
                // Buscamos el sku
                let skuSeleccionado = skus.find(
                  s => s._id.toString() === a.idSku
                )
                // Modificamos la entrada de almacen.
                // 1.- Obtenemos el lote más antiguo por defecto.
                skuSeleccionado.descontarMovimientoUltimoLoteConExistencia(
                  // 2.- creamos el nuevo movimiento
                  {
                    cantidad: a.cantidad,
                    // true entrada, false salida.
                    esEntrada: false,
                    observaciones: "[ SISTEMA ] Salida POS",
                    usuario: req.user._id,
                    remision: remision._id,
                  }
                )
                promesas.push(skuSeleccionado.save())
              })
              return Promise.all(promesas)
            })
            .then(skusG => {
              resolve(remisionGuardada)
            })
        })
      })
      .then(r => res.send(r))
      .catch(_ => {
        next(_)
      })
  }
)

app.get(
  "/",
  $("contabilidad:remision:leer:todo", "Leer todas las remisiones"),
  (req, res, next) => {
    // Todo lleva desde hasta

    let consecutivo = {
      $gte: req.query?.consecutivo_desde ?? undefined,
      $lte: req.query?.consecutivo_hasta ?? undefined,
    }

    let created_at = {
      $gte: req.query?.create_at_desde ?? undefined,
      $lte: req.query?.create_at_hasta ?? undefined,
    }

    let usuario = { $in: req.query?.usuario?.split(",") ?? undefined } //Debe ser un arreglo

    ;[created_at, consecutivo].forEach(x => {
      if (!x.$gte) delete x.$gte
      if (!x.$lte) delete x.$lte
    })

    let filtros = {
      consecutivo,
      create_at: created_at,
      usuario,
    }

    for (const key in filtros) {
      if (
        !filtros[key] ||
        Object.keys(filtros[key]).length === 0 ||
        (key === "usuario" && !filtros[key]["$in"])
      )
        delete filtros[key]
    }

    let limit = req.query?.limit ?? 30
    let skip = req.query?.skip ?? 0
    let sort = req.query?.sort ?? -1
    let sort_campo = req.query?.sort_campo ?? "created_at"

    Remision.find(filtros)
      .select("consecutivo usuario total created_at")
      .skip(skip)
      .limit(limit)
      .sort({ [sort_campo]: sort })
      .then(remisiones => res.send({ remisiones }))
      .catch(_ => next(_))
  }
)

module.exports = app
