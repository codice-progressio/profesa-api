let express = require("express")
let app = express()

var SKU = require("../../models/sku.model")

const RESP = require("../../utils/respStatus")
const $ =  require("@codice-progressio/easy-permissions").$

app.get(
  "/",
  $("almacenDeProductoTerminado:leer:todo"),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombreCompleto")

    const total = await SKU.countDocuments().exec()

    SKU.aggregate([
      { $match: {} },
      {
        $project: {
          nombreCompleto: "$nombreCompleto",
          existencia: "$existencia",
          lotes: "$lotes",
          esBaston: "$esBaston",
          stockMinimo: "$stockMinimo",
          stockMaximo: "$stockMaximo",
        },
      },
      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } },
    ])
      .exec()
      .then(modelosCompletos => {
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })

        return RESP._200(res, null, [
          { tipo: "modelosCompletos", datos: modelosCompletos },
          { tipo: "total", datos: total.pop().total },
        ])
      })
      .catch(err =>
        erro(res, err, "Hubo un error buscando los modelos completos")
      )
  }
)

app.get(
  "/buscar/:termino",
  $("almacenProductoTerminado:leer:termino"),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombre")
    const termino = String(
      req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    const b = campo => ({
      [campo]: { $regex: termino, $options: "i" },
    })

    const $match = {
      $or: [],
    }

    ;["nombreCompleto"].forEach(x => $match.$or.push(b(x)))

    const total = await SKU.aggregate([{ $match }, { $count: "total" }]).exec()

    SKU.aggregate([
      { $match },

      {
        $project: {
          nombreCompleto: "$nombreCompleto",
          existencia: "$existencia",
          lotes: "$lotes",
          esBaston: "$esBaston",
          stockMinimo: "$stockMinimo",
          stockMaximo: "$stockMaximo",
        },
      },

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } },
    ])
      .exec()
      .then(modeloscompletos => {
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })

        return RESP._200(res, null, [
          { tipo: "modeloscompletos", datos: modeloscompletos },
          { tipo: "total", datos: total.pop().total },
        ])
      })
      .catch(err =>
        erro(
          res,
          err,
          "Hubo un error buscando las modeloscompletos por el termino " +
            termino
        )
      )
  }
)

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

/**
 * Consolidamos los lotes de los modelos completos de manera manual.l
 * Esta operacion recalcula los lotes existentes en base al mes y anio de
 * creacion y despues junta las entradas y salidas calculando a su vez
 * existencia total, existencia por lote y cantidad entrada.
 *
 *
 *
 *
 */
app.get(
  "/consolidar/:idModelo",
  $("almacenDeProductoTerminado:consolidar:modelo"),
  (req, res) => {
    const idModelo = req.params.idModelo
    SKU.findById(idModelo)
      .exec()
      .then(sku => {
        if (!sku) throw "No existe el modelo"
        //Organizamos todo en base a una llave
        const lotesOrganizados = {}

        sku.lotes.forEach(lote => {
          const fl = lote.createAt
          // la estructura de la llave se obtiene de la fecha de creacion
          // del lote y tiene la siguientee estructura 2020@01 que representa
          // anio y mes. No afecta demasiado pero si pasan varios anios
          // se puede confundir un lote de 2019-01 con 2020-01 si no se toma
          // en cuenta la fecha.
          const mesLote = fl.getFullYear() + "@" + fl.getMonth()

          if (!lotesOrganizados.hasOwnProperty(mesLote))
            lotesOrganizados[mesLote] = []

          lotesOrganizados[mesLote].push(lote)
        })

        //Almacenamos la estructura final de los lotes.
        const lotesFinales = []

        //Recorremos todos los lotes semi-ordenados para
        //obtener los nuevos calculos.
        for (const key in lotesOrganizados) {
          if (lotesOrganizados.hasOwnProperty(key)) {
            const lotes = lotesOrganizados[key]

            const lnew = {
              existencia: 0,
              cantidadEntrada: 0,
              salidas: [],
              entradas: [],
              devoluciones: [],
              validandoDevolucion: false,
              observaciones: "",
              createAt: null,
            }

            lotes.forEach(lote => {
              //Reciclamos la operacion de reduccion.
              const reduce = (a, b) => +a + +b.cantidad
              //Sumamos todas las salidas y las entradas
              const salidas = lote.salidas.reduce(reduce, 0)
              const entradas = lote.entradas.reduce(reduce, 0)
              //Calculamos de nuevo la existencia para el nuevo lote
              lnew.existencia += entradas - salidas

              //Guardamos la cantidad de entrada que se registraron
              lnew.cantidadEntrada += entradas

              //Concatenamos los arreglos de cada lote sin arreglar
              // para que queden dentro del nuevo grupo.
              lnew.salidas = lnew.salidas.concat(lote.salidas)
              lnew.entradas = lnew.entradas.concat(lote.entradas)
              lnew.devoluciones = lnew.devoluciones.concat(lote.devoluciones)
            })
            const loteParaDatos = lotes.pop()
            //Copiamos la fecha del primer lote del grupo.
            //Funciona por que los lotes ya estaban ordenados.
            lnew.createAt = loteParaDatos.createAt
            lnew.observaciones = loteParaDatos.observaciones
            lnew.validandoDevolucion = loteParaDatos.validandoDevolucion

            lotesFinales.push(lnew)
          }
        }
        //Asignamos los lotes.
        sku.lotes = lotesFinales
        //Sumanos la existencia de cada lote nuevo.
        sku.existencia = sku.lotes.reduce((a, b) => +a + +b.existencia, 0)
        return sku.save()
      })
      .then(sku => {
        return RESP._200(
          res,
          "Se consolidaron los lotes del modelo de manera correcta",
          [{ tipo: "sku", datos: sku }]
        )
      })
      .catch(err => erro(res, err, "Error consolidando"))
  }
)

module.exports = app
